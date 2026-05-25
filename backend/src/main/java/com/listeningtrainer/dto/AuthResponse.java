package com.listeningtrainer.dto;

public class AuthResponse {

    private String token;
    private String email;

    public AuthResponse(String token, String email) {
        this.token = token;
        this.email = email;
    }

    public String getToken() { return token; }
    public String getEmail() { return email; }
}
