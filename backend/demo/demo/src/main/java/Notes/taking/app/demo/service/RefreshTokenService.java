package notes.taking.app.demo.service;

import notes.taking.app.demo.entity.User;

public interface RefreshTokenService {

    String issueToken(User user);

    User validateAndConsume(String refreshToken);

    void revokeIfPresent(String refreshToken);
}
