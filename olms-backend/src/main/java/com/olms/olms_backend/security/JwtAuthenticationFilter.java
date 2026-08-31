package com.olms.olms_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        System.out.println("Authorization Header: " + authHeader);

        // No token -> continue normally
        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            System.out.println("No Bearer token found - continuing request");

            filterChain.doFilter(request, response);
            return;
        }
        String token = authHeader.substring(7);

        filterChain.doFilter(request, response);
    }
}