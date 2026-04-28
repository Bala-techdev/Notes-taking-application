package Notes.taking.app.demo.service;

import Notes.taking.app.demo.dto.CodeExecutionRequest;
import Notes.taking.app.demo.dto.CodeExecutionResponse;
import Notes.taking.app.demo.dto.PistonApiRequest;
import Notes.taking.app.demo.dto.PistonApiResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class LocalAwareCodeExecutionService {

    private static final String PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";
    private static final long LOCAL_EXECUTION_TIMEOUT_SECONDS = 10;

    private final RestTemplate restTemplate;
    private final String pistonApiToken;

    public LocalAwareCodeExecutionService(RestTemplate restTemplate,
                                          @Value("${app.piston.api-token:}") String pistonApiToken) {
        this.restTemplate = restTemplate;
        this.pistonApiToken = pistonApiToken;
    }

    public CodeExecutionResponse executeCode(CodeExecutionRequest request) {
        try {
            request.validate();

            if (hasPistonToken()) {
                return executeViaPiston(request);
            }

            return executeLocally(request);
        } catch (HttpClientErrorException.Unauthorized e) {
            log.error("Piston API rejected the request with 401 Unauthorized", e);
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError("Piston API rejected the request with 401 Unauthorized. Check your Piston token.");
            response.setExitCode(-1);
            return response;
        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError(e.getMessage());
            response.setExitCode(-1);
            return response;
        } catch (RestClientException e) {
            log.error("Error calling Piston API: {}", e.getMessage(), e);
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError("Failed to execute code: " + e.getMessage());
            response.setExitCode(-1);
            return response;
        } catch (Exception e) {
            log.error("Unexpected error during code execution: {}", e.getMessage(), e);
            CodeExecutionResponse response = new CodeExecutionResponse();
            response.setError("Unexpected error: " + e.getMessage());
            response.setExitCode(-1);
            return response;
        }
    }

    private boolean hasPistonToken() {
        return pistonApiToken != null && !pistonApiToken.trim().isEmpty();
    }

    private CodeExecutionResponse executeViaPiston(CodeExecutionRequest request) {
        PistonApiRequest pistonRequest = buildPistonRequest(request);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(pistonApiToken.trim());

        HttpEntity<PistonApiRequest> entity = new HttpEntity<>(pistonRequest, headers);
        PistonApiResponse pistonResponse = restTemplate.exchange(
            PISTON_API_URL,
            HttpMethod.POST,
            entity,
            PistonApiResponse.class
        ).getBody();

        return mapPistonResponse(pistonResponse);
    }

    private CodeExecutionResponse executeLocally(CodeExecutionRequest request) throws IOException, InterruptedException {
        String language = normalizeLanguage(request.getLanguage());

        switch (language) {
            case "python":
                return executePython(request.getCode());
            case "javascript":
                return executeJavaScript(request.getCode());
            case "java":
                return executeJava(request.getCode());
            default:
                CodeExecutionResponse response = new CodeExecutionResponse();
                response.setError(
                    "Piston API token is not configured and local execution is only available for Java, Python, and JavaScript on this machine. Set app.piston.api-token or PISTON_API_TOKEN to enable all supported languages."
                );
                response.setExitCode(-1);
                return response;
        }
    }

    private CodeExecutionResponse executePython(String code) throws IOException, InterruptedException {
        Path workDir = Files.createTempDirectory("code-run-python-");
        Path sourceFile = workDir.resolve("main.py");
        Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
        return runProcess(List.of("python", sourceFile.toString()), workDir);
    }

    private CodeExecutionResponse executeJavaScript(String code) throws IOException, InterruptedException {
        Path workDir = Files.createTempDirectory("code-run-js-");
        Path sourceFile = workDir.resolve("main.js");
        Files.writeString(sourceFile, code, StandardCharsets.UTF_8);
        return runProcess(List.of("node", sourceFile.toString()), workDir);
    }

    private CodeExecutionResponse executeJava(String code) throws IOException, InterruptedException {
        Path workDir = Files.createTempDirectory("code-run-java-");
        Path sourceFile = workDir.resolve("Main.java");
        Files.writeString(sourceFile, code, StandardCharsets.UTF_8);

        CodeExecutionResponse compileResult = runProcess(List.of("javac", sourceFile.getFileName().toString()), workDir);
        if (compileResult.getExitCode() != null && compileResult.getExitCode() != 0) {
            return compileResult;
        }

        return runProcess(List.of("java", "-cp", workDir.toString(), "Main"), workDir);
    }

    private CodeExecutionResponse runProcess(List<String> command, Path workDir) throws IOException, InterruptedException {
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.directory(workDir.toFile());
        processBuilder.redirectErrorStream(false);

        Process process = processBuilder.start();
        boolean finished = process.waitFor(LOCAL_EXECUTION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        CodeExecutionResponse response = new CodeExecutionResponse();

        if (!finished) {
            process.destroyForcibly();
            response.setError("Local execution timed out after " + LOCAL_EXECUTION_TIMEOUT_SECONDS + " seconds");
            response.setExitCode(-1);
            return response;
        }

        String stdout = readStream(process.getInputStream());
        String stderr = readStream(process.getErrorStream());

        response.setStdout(stdout);
        response.setStderr(stderr);
        response.setExitCode(process.exitValue());
        response.setExecutionTime(TimeUnit.SECONDS.toMillis(LOCAL_EXECUTION_TIMEOUT_SECONDS));
        return response;
    }

    private String readStream(java.io.InputStream inputStream) throws IOException {
        return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }

    private PistonApiRequest buildPistonRequest(CodeExecutionRequest request) {
        PistonApiRequest pistonRequest = new PistonApiRequest();
        pistonRequest.setLanguage(mapLanguage(request.getLanguage()));
        pistonRequest.setVersion("*");

        PistonApiRequest.PistonFile file = new PistonApiRequest.PistonFile();
        file.setName("main." + getFileExtension(request.getLanguage()));
        file.setContent(request.getCode());

        pistonRequest.setFiles(new PistonApiRequest.PistonFile[]{file});
        return pistonRequest;
    }

    private CodeExecutionResponse mapPistonResponse(PistonApiResponse pistonResponse) {
        CodeExecutionResponse response = new CodeExecutionResponse();

        if (pistonResponse != null) {
            PistonApiResponse.RunOutput runOutput = pistonResponse.getRun();
            PistonApiResponse.CompileOutput compileOutput = pistonResponse.getCompile();

            if (runOutput != null) {
                response.setStdout(runOutput.getStdout());
                response.setStderr(runOutput.getStderr());
                response.setExitCode(runOutput.getCode());
                response.setExecutionTime(runOutput.getTime());
            }

            if (compileOutput != null && runOutput == null) {
                response.setStdout(compileOutput.getStdout());
                response.setStderr(compileOutput.getStderr());
                response.setExitCode(compileOutput.getCode());
                response.setExecutionTime(compileOutput.getTime());
            }
        }

        return response;
    }

    private String normalizeLanguage(String language) {
        return language == null ? "" : language.toLowerCase(Locale.ROOT).trim();
    }

    private String mapLanguage(String language) {
        switch (normalizeLanguage(language)) {
            case "python":
                return "python";
            case "javascript":
                return "javascript";
            case "java":
                return "java";
            case "cpp":
            case "c++":
                return "cpp";
            case "c":
                return "c";
            case "go":
                return "go";
            case "rust":
                return "rust";
            case "ruby":
                return "ruby";
            default:
                return normalizeLanguage(language);
        }
    }

    private String getFileExtension(String language) {
        switch (normalizeLanguage(language)) {
            case "python":
                return "py";
            case "javascript":
                return "js";
            case "java":
                return "java";
            case "cpp":
            case "c++":
                return "cpp";
            case "c":
                return "c";
            case "go":
                return "go";
            case "rust":
                return "rs";
            case "ruby":
                return "rb";
            default:
                return "txt";
        }
    }
}
