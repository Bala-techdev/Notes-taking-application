package notes.taking.app.demo.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import notes.taking.app.demo.entity.RefreshToken;
import notes.taking.app.demo.entity.User;
import notes.taking.app.demo.exception.InvalidTokenException;
import notes.taking.app.demo.exception.TokenExpiredException;
import notes.taking.app.demo.repository.RefreshTokenRepository;
import notes.taking.app.demo.security.JwtUtil;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Override
    public String issueToken(User user) {
        String token = jwtUtil.generateRefreshToken(user.getEmail());

        RefreshToken refreshToken = RefreshToken.builder()
                .tokenHash(hash(token))
                .user(user)
                .expiresAt(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000L))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);
        return token;
    }

    @Override
    public User validateAndConsume(String refreshToken) {
        String subject = jwtUtil.extractRefreshSubject(refreshToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash(refreshToken))
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (!stored.getUser().getEmail().equalsIgnoreCase(subject)) {
            throw new InvalidTokenException("Refresh token does not match user");
        }

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            stored.setRevoked(true);
            stored.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(stored);
            throw new TokenExpiredException("Refresh token expired");
        }

        stored.setRevoked(true);
        stored.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(stored);

        return stored.getUser();
    }

    @Override
    public void revokeIfPresent(String refreshToken) {
        String token = refreshToken == null ? "" : refreshToken.trim();
        if (token.isEmpty()) {
            return;
        }

        refreshTokenRepository.findByTokenHashAndRevokedFalse(hash(token)).ifPresent(stored -> {
            stored.setRevoked(true);
            stored.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(stored);
        });
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] tokenHash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(tokenHash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to hash refresh token", ex);
        }
    }
}
