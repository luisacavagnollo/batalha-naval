package com.batalha_naval.service;

import com.batalha_naval.model.User;
import com.batalha_naval.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(String username, String email, String password) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Nome de usuário é obrigatório");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório");
        }
        if (password == null || password.length() < 4) {
            throw new IllegalArgumentException("Senha deve ter no mínimo 4 caracteres");
        }
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Nome de usuário já está em uso");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("E-mail já está cadastrado");
        }

        var user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        return userRepository.save(user);
    }

    public Optional<User> authenticate(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(user -> passwordEncoder.matches(password, user.getPassword()));
    }
}
