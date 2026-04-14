package Notes.taking.app.demo.service;

import Notes.taking.app.demo.dto.UserRequest;
import Notes.taking.app.demo.dto.UserResponse;

public interface UserService {

    UserResponse registerUser(UserRequest request);

    UserResponse findUserByEmail(String email);
}
