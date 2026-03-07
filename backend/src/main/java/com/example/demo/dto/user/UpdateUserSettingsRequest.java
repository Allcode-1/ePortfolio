package com.example.demo.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateUserSettingsRequest {
    @NotBlank(message = "accountVisibility is required")
    @Pattern(regexp = "public|private", message = "accountVisibility must be either 'public' or 'private'")
    private String accountVisibility;
}
