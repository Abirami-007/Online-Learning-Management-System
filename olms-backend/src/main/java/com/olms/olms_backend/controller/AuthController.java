package com.olms.olms_backend.controller;

import com.olms.olms_backend.entity.User;
import com.olms.olms_backend.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final com.olms.olms_backend.util.JwtUtil jwtUtil;

    public AuthController(AuthService authService, com.olms.olms_backend.util.JwtUtil jwtUtil) {
        this.authService = authService;
        this.jwtUtil = jwtUtil;
    }

    // REGISTER
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {

        User registeredUser = authService.register(user);

        return ResponseEntity.ok(registeredUser);
    }

    // LOGIN
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody User user) {

        try {

            String token = authService.login(
                    user.getEmail(),
                    user.getPassword()
            );

            return ResponseEntity.ok(token);

        } catch (RuntimeException e) {

            return ResponseEntity.status(401)
                    .body("Invalid email or password");
        }
    }

    // GET LOGGED IN USER
    @GetMapping("/me")
    public ResponseEntity<User> getMe(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        String token = authHeader.replace("Bearer ", "");
        String email = jwtUtil.extractEmail(token);
        User user = authService.findByEmail(email);
        user.setPassword(null); // Remove password for security
        return ResponseEntity.ok(user);
    }
}