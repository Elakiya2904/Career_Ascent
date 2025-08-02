"use server";

import { z } from "zod";
import { callNexus } from "@/ai/nexus";
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import { Buffer } from "buffer";

const AnalyzeResumeInputSchema = z.object({
  resumeText: z.string().min(10, "Resume text is too short"),
  jobTitle: z.string().min(2, "Job title is required"),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

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

export async function analyzeResume(
  rawInput: unknown
): Promise<AnalyzeResumeOutput> {
  let input = rawInput;

  // If input uses resumeDataUri (PDF base64), replace with placeholder text for now
  if (
    input &&
    typeof input === "object" &&
    "resumeDataUri" in input &&
    typeof (input as any).resumeDataUri === "string"
  ) {
    try {
      const resumeDataUri = (input as any).resumeDataUri;
      const jobTitle = (input as any).jobTitle || "Unknown";
      const base64 = resumeDataUri.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      const { text } = await pdf(buffer);
      input = {
        resumeText: text || "No text extracted from PDF.",
        jobTitle,
      };
    } catch (err) {
      console.error("❌ Failed to extract text from PDF:", err);
      input = {
        resumeText: "No text could be extracted from the uploaded PDF.",
        jobTitle: (input as any).jobTitle || "Unknown",
      };
    }
  }

  const parsed = AnalyzeResumeInputSchema.safeParse(input);
  if (!parsed.success) {
    console.error("❌ Invalid input:", parsed.error.format());
    throw new Error("Invalid input to analyzeResume");
  }

  const { resumeText, jobTitle } = parsed.data;

  const prompt = `
You are an expert resume analyst.

Analyze the following resume for the job title: "${jobTitle}".

Provide:
- A match score (0–100)
- A concise analysis of how well the resume fits the role
- 2–5 improvement suggestions, each with a specific point and actionable advice

Resume:
"""${resumeText.slice(0, 8000)}"""

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

  let response;
  try {
    response = await callNexus(prompt);
    console.log(
      "✅ Response from callNexus:",
      JSON.stringify(response, null, 2)
    );
  } catch (error: any) {
    console.error(
      "❌ Nexus call failed:",
      error?.response?.data || error.message || error
    );
    throw new Error("Failed to call Nexus");
  }

  let parsedResponse;
  try {
    const content =
      typeof response === "string"
        ? response
        : response?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.error("❌ Invalid content from Nexus response:", response);
      throw new Error("Unexpected Nexus response format");
    }

    parsedResponse = JSON.parse(content);
  } catch (e) {
    console.error("❌ Failed to parse Nexus response:", e, "Raw:", response);
    throw new Error("Invalid response format from Nexus");
  }

  return AnalyzeResumeOutputSchema.parse(parsedResponse);
}
