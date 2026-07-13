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

    private static final int USERNAME_MIN = 3;
    private static final int USERNAME_MAX = 20;
    private static final int PASSWORD_MIN = 6;
    private static final String USERNAME_PATTERN = "^[a-zA-Z][a-zA-Z0-9_]*$";
    private static final String EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

    public User register(String username, String email, String password) {
        // --- Username ---
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Nome de usuário é obrigatório");
        }
        username = username.trim();
        if (username.length() < USERNAME_MIN || username.length() > USERNAME_MAX) {
            throw new IllegalArgumentException("Usuário deve ter entre " + USERNAME_MIN + " e " + USERNAME_MAX + " caracteres");
        }
        if (!username.matches(USERNAME_PATTERN)) {
            throw new IllegalArgumentException("Usuário deve começar com letra e conter apenas letras, números e _");
        }

        // --- Email ---
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("E-mail é obrigatório");
        }
        email = email.trim().toLowerCase();
        if (!email.matches(EMAIL_PATTERN)) {
            throw new IllegalArgumentException("E-mail inválido");
        }

        // --- Senha ---
        if (password == null || password.length() < PASSWORD_MIN) {
            throw new IllegalArgumentException("Senha deve ter no mínimo " + PASSWORD_MIN + " caracteres");
        }
        if (!password.matches(".*[A-Za-z].*") || !password.matches(".*[0-9].*")) {
            throw new IllegalArgumentException("Senha deve conter pelo menos uma letra e um número");
        }

        // --- Duplicatas ---
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
