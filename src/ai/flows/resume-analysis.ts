'use server';

import { z } from 'zod';
import { callNexus } from '@/ai/nexus';

// 1. Zod Schema for input validation
const AnalyzeResumeInputSchema = z.object({
  resumeText: z.string().min(10, "Resume text is too short"),
  jobTitle: z.string().min(2, "Job title is required"),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

// 2. Output schema definition
const AnalyzeResumeOutputSchema = z.object({
  matchScore: z.number(),
  analysis: z.string(),
  suggestions: z.array(
    z.object({
      point: z.string(),
      suggestion: z.string(),
    })
  ),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

// 3. Function that analyzes resume
export async function analyzeResume(
  rawInput: unknown
): Promise<AnalyzeResumeOutput> {
  // Log raw input for debugging
  console.log('analyzeResume input:', rawInput);

  // Validate input using Zod
  const parsed = AnalyzeResumeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    console.error('❌ Invalid analyzeResume input:', parsed.error.format());
    throw new Error('Invalid input to analyzeResume');
  }

  const { resumeText, jobTitle } = parsed.data;

  // Optional: limit length to avoid token overflow
  const trimmedResume = resumeText.trim().slice(0, 8000);

  // Prompt for the LLM
  const prompt = `
You are an expert resume analyst.

Analyze the following resume for the job title: "${jobTitle}".

Provide:
- A match score (0–100)
- A concise analysis of how well the resume fits the role
- 2–5 improvement suggestions, each with a specific point and actionable advice

Resume:
"""${trimmedResume}"""

Respond strictly in this JSON format:
{
  "matchScore": 0,
  "analysis": "",
  "suggestions": [
    {
      "point": "",
      "suggestion": ""
    }
  ]
}
`;

  // Call Nexus API
  const response = await callNexus(prompt, { model: 'nova-micro' });

  // Parse the model's response safely
  let analysis: AnalyzeResumeOutput;
  try {
    if (typeof response === 'string') {
      analysis = JSON.parse(response);
    } else if (response.choices && response.choices[0]?.message?.content) {
      analysis = JSON.parse(response.choices[0].message.content);
    } else {
      throw new Error('Unexpected response format from Nexus');
    }
  } catch (e) {
    console.error('❌ Failed to parse Nexus response JSON:', e, 'Response:', response);
    throw new Error('Invalid JSON response from Nexus');
  }

  // Final validation against output schema
  return AnalyzeResumeOutputSchema.parse(analysis);
}
