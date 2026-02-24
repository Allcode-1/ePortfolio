package com.example.demo.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiImproveResponse {
    private String improvedText;
    private String summary;
    private List<String> highlights;
}
