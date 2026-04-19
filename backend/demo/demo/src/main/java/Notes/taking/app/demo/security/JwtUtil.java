package notes.taking.app.demo.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Objects;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import notes.taking.app.demo.exception.InvalidTokenException;
import notes.taking.app.demo.exception.TokenExpiredException;

@Component
public class JwtUtil {

    private static final String TOKEN_TYPE_CLAIM = "type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    private final SecretKey signingKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expiration-ms}") long accessExpirationMs,
                   @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs) {
        if (!StringUtils.hasText(secret)) {
            throw new IllegalStateException("Missing app.jwt.secret. Set JWT_SECRET environment variable.");
        }

        byte[] keyBytes = isBase64(secret)
                ? Decoders.BASE64.decode(secret)
                : secret.getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateToken(String subject) {
        return generateAccessToken(subject);
    }

    public String generateAccessToken(String subject) {
        return generateToken(subject, ACCESS_TOKEN_TYPE, accessExpirationMs);
    }

    public String generateRefreshToken(String subject) {
        return generateToken(subject, REFRESH_TOKEN_TYPE, refreshExpirationMs);
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    public String extractUsername(String token) {
        return extractSubject(token, ACCESS_TOKEN_TYPE);
    }

    public String extractRefreshSubject(String token) {
        return extractSubject(token, REFRESH_TOKEN_TYPE);
    }

    public boolean validateToken(String token, String username) {
        try {
            String subject = extractUsername(token);
            return subject != null && subject.equals(username) && !isTokenExpired(token, ACCESS_TOKEN_TYPE);
        } catch (InvalidTokenException | TokenExpiredException ex) {
            return false;
        }
    }

    private String generateToken(String subject, String tokenType, long expirationMs) {
        Objects.requireNonNull(subject, "Token subject cannot be null");

        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(subject)
                .claim(TOKEN_TYPE_CLAIM, tokenType)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    private String extractSubject(String token, String expectedType) {
        Claims claims = extractClaims(token);
        String actualType = claims.get(TOKEN_TYPE_CLAIM, String.class);
        if (!expectedType.equals(actualType)) {
            throw new InvalidTokenException("Unexpected token type");
        }
        return claims.getSubject();
    }

    private boolean isTokenExpired(String token, String expectedType) {
        Claims claims = extractClaims(token);
        String actualType = claims.get(TOKEN_TYPE_CLAIM, String.class);
        if (!expectedType.equals(actualType)) {
            throw new InvalidTokenException("Unexpected token type");
        }
        return claims.getExpiration().before(new Date());
    }

    private Claims extractClaims(String token) {
        if (token == null || token.isBlank()) {
            throw new InvalidTokenException("Token is blank");
        }

        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            throw new TokenExpiredException("Token has expired");
        } catch (JwtException | IllegalArgumentException ex) {
            throw new InvalidTokenException("Invalid token");
        }
    }

    private boolean isBase64(String value) {
        return value != null && value.matches("^[A-Za-z0-9+/=\\s]+$");
    }
}

