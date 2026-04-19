package notes.taking.app.demo.service;

import notes.taking.app.demo.dto.UserRequest;
import notes.taking.app.demo.dto.UpdateProfileRequest;
import notes.taking.app.demo.dto.UserProfileResponse;
import notes.taking.app.demo.dto.UserResponse;

public interface UserService {

    UserResponse registerUser(UserRequest request);

    UserResponse findUserByEmail(String email);

    UserProfileResponse getCurrentUserProfile();

    UserProfileResponse updateCurrentUserProfile(UpdateProfileRequest request);
}

