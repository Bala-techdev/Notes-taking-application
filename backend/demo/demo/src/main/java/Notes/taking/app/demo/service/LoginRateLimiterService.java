package notes.taking.app.demo.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import notes.taking.app.demo.exception.TooManyRequestsException;

@Service
public class LoginRateLimiterService {

    private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
    private final int maxAttempts;
    private final Duration lockDuration;

    public LoginRateLimiterService(
            @Value("${app.security.login-rate-limit.max-attempts:5}") int maxAttempts,
            @Value("${app.security.login-rate-limit.window-seconds:900}") long windowSeconds) {
        this.maxAttempts = maxAttempts;
        this.lockDuration = Duration.ofSeconds(windowSeconds);
    }

    public void checkAllowed(String email) {
        AttemptWindow window = attempts.get(normalize(email));
        if (window == null) {
            return;
        }

        if (Instant.now().isAfter(window.firstAttempt.plus(lockDuration))) {
            attempts.remove(normalize(email));
            return;
        }

        if (window.count >= maxAttempts) {
            throw new TooManyRequestsException("Too many login attempts. Please try again later.");
        }
    }

    public void recordFailure(String email) {
        String key = normalize(email);
        Instant now = Instant.now();

        attempts.compute(key, (k, current) -> {
            if (current == null || now.isAfter(current.firstAttempt.plus(lockDuration))) {
                return new AttemptWindow(1, now);
            }
            current.count++;
            return current;
        });
    }

    public void recordSuccess(String email) {
        attempts.remove(normalize(email));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private static class AttemptWindow {
        private int count;
        private final Instant firstAttempt;

        private AttemptWindow(int count, Instant firstAttempt) {
            this.count = count;
            this.firstAttempt = firstAttempt;
        }
    }
}
