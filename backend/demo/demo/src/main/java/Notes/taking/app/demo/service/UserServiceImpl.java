package Notes.taking.app.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;

import Notes.taking.app.demo.entity.User;
import Notes.taking.app.demo.exception.DuplicateResourceException;
import Notes.taking.app.demo.exception.ResourceNotFoundException;
import Notes.taking.app.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User registerUser(User user) {
        userRepository.findByEmail(user.getEmail()).ifPresent(existing -> {
            throw new DuplicateResourceException("Email already exists: " + user.getEmail());
        });

        userRepository.findByUsername(user.getUsername()).ifPresent(existing -> {
            throw new DuplicateResourceException("Username already exists: " + user.getUsername());
        });

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }
}
