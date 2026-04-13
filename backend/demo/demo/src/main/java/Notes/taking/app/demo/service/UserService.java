package Notes.taking.app.demo.service;

import Notes.taking.app.demo.entity.User;

public interface UserService {

    User registerUser(User user);

    User findUserByEmail(String email);
}
