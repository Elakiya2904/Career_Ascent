"use server";

import { z } from "zod";
import { callNexus } from "@/ai/nexus";

const JobRecommendationsInputSchema = z.object({
  resumeText: z
    .string()
    .describe("Plain text extracted from the user's resume"),
});
export type JobRecommendationsInput = z.infer<
  typeof JobRecommendationsInputSchema
>;

const JobRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      jobTitle: z.string(),
      company: z.string(),
      reasoning: z.string(),
    })
  ),
});
export type JobRecommendationsOutput = z.infer<
  typeof JobRecommendationsOutputSchema
>;

export async function jobRecommendations(
  rawInput: unknown
): Promise<JobRecommendationsOutput> {
  console.log("📥 Raw input to jobRecommendations:", rawInput);

  let input = rawInput as unknown;

  if (
    input &&
    typeof input === "object" &&
    "resumeDataUri" in input &&
    typeof (input as any).resumeDataUri === "string"
  ) {
    input = {
      resumeText:
        "This resume is provided as a PDF. Text extraction not implemented yet.",
    };
  }

  const parsed = JobRecommendationsInputSchema.safeParse(input);
  if (!parsed.success) {
    console.error(
      "❌ Invalid input to jobRecommendations:",
      parsed.error.format()
    );
    throw new Error("Invalid input to jobRecommendations");
  }

  const inputData = parsed.data;

  const prompt = `
You are an expert job market analyst. Based on the resume below, recommend exactly three suitable job titles and companies. For each recommendation, provide a clear reason why the candidate is a good fit.

Resume:
"""${inputData.resumeText.slice(0, 8000)}"""

Respond strictly in this JSON format:
{
  "recommendations": [
    {
      "jobTitle": "string",
      "company": "string",
      "reasoning": "string"
    },
    {
      "jobTitle": "string",
      "company": "string",
      "reasoning": "string"
    },
    {
      "jobTitle": "string",
      "company": "string",
      "reasoning": "string"
    }
  ]
}
`.trim();

  const response = await callNexus(prompt, { model: "nova-micro" });

  let recommendations: JobRecommendationsOutput;
  try {
    const content =
      typeof response === "string"
        ? response
        : response.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      throw new Error("Unexpected response format from Nexus");
    }

    recommendations = JSON.parse(content);
  } catch (err) {
    console.error(
      "❌ Failed to parse Nexus response as JSON:",
      err,
      "Response:",
      response
    );
    throw new Error("Invalid JSON response from Nexus");
  }

  return JobRecommendationsOutputSchema.parse(recommendations);
}
