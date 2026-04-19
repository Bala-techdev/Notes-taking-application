package notes.taking.app.demo.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import notes.taking.app.demo.dto.AuthResponseDto;
import notes.taking.app.demo.dto.LoginRequestDto;
import notes.taking.app.demo.dto.RefreshTokenRequestDto;
import notes.taking.app.demo.dto.UserRequest;
import notes.taking.app.demo.dto.UserResponse;
import notes.taking.app.demo.entity.User;
import notes.taking.app.demo.exception.ResourceNotFoundException;
import notes.taking.app.demo.repository.UserRepository;
import notes.taking.app.demo.security.JwtUtil;
import notes.taking.app.demo.service.LoginRateLimiterService;
import notes.taking.app.demo.service.RefreshTokenService;
import notes.taking.app.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final LoginRateLimiterService loginRateLimiterService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerUser(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto requestDto) {
        final String email = requestDto.getEmail().trim().toLowerCase();
        loginRateLimiterService.checkAllowed(email);

        final Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, requestDto.getPassword()));
        } catch (BadCredentialsException ex) {
            loginRateLimiterService.recordFailure(email);
            throw ex;
        }

        loginRateLimiterService.recordSuccess(email);

        final UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        final User user = userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userDetails.getUsername()));

        final String accessToken = jwtUtil.generateAccessToken(userDetails.getUsername());
        final String refreshToken = refreshTokenService.issueToken(user);

        return ResponseEntity.ok(AuthResponseDto.builder()
            .token(accessToken)
                .tokenType("Bearer")
            .refreshToken(refreshToken)
            .accessTokenExpiresInMs(jwtUtil.getAccessExpirationMs())
            .refreshTokenExpiresInMs(jwtUtil.getRefreshExpirationMs())
                .build());
    }

        @PostMapping("/refresh")
        public ResponseEntity<AuthResponseDto> refresh(@Valid @RequestBody RefreshTokenRequestDto requestDto) {
        User user = refreshTokenService.validateAndConsume(requestDto.getRefreshToken());
        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.issueToken(user);

        return ResponseEntity.ok(AuthResponseDto.builder()
            .token(accessToken)
            .tokenType("Bearer")
            .refreshToken(refreshToken)
            .accessTokenExpiresInMs(jwtUtil.getAccessExpirationMs())
            .refreshTokenExpiresInMs(jwtUtil.getRefreshExpirationMs())
            .build());
        }

        @PostMapping("/logout")
        public ResponseEntity<Void> logout(@Valid @RequestBody RefreshTokenRequestDto requestDto) {
        refreshTokenService.revokeIfPresent(requestDto.getRefreshToken());
        return ResponseEntity.noContent().build();
        }
}

