package notes.taking.app.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import notes.taking.app.demo.dto.UserRequest;
import notes.taking.app.demo.dto.UserResponse;
import notes.taking.app.demo.entity.User;
import notes.taking.app.demo.exception.DuplicateResourceException;
import notes.taking.app.demo.exception.ResourceNotFoundException;
import notes.taking.app.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse registerUser(UserRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            throw new DuplicateResourceException("Email already exists: " + request.getEmail());
        });

        userRepository.findByUsername(request.getUsername()).ifPresent(existing -> {
            throw new DuplicateResourceException("Username already exists: " + request.getUsername());
        });

        User user = mapToEntity(request);

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return mapToResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToResponse(user);
    }

    private User mapToEntity(UserRequest request) {
        return User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(request.getPassword())
                .build();
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }
}

