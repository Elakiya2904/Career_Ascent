'use server';

import { z } from 'zod';
import { callNexus } from '@/ai/nexus';

const JobRecommendationsInputSchema = z.object({
  resumeText: z.string().describe("Plain text extracted from the user's resume"),
});
export type JobRecommendationsInput = z.infer<typeof JobRecommendationsInputSchema>;

const JobRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      jobTitle: z.string(),
      company: z.string(),
      reasoning: z.string(),
    })
  ),
});
export type JobRecommendationsOutput = z.infer<typeof JobRecommendationsOutputSchema>;

export async function jobRecommendations(
  input: JobRecommendationsInput
): Promise<JobRecommendationsOutput> {
  const prompt = `
You are an expert job market analyst. Based on the resume below, recommend three suitable job titles and companies. For each recommendation, provide a clear reason why the candidate is a good fit.

Resume:
${input.resumeText}

Respond in the following JSON format:
{
  "recommendations": [
    {
      "jobTitle": "...",
      "company": "...",
      "reasoning": "..."
    }
  ]
}
`;

  const response = await callNexus(prompt, { model: 'nova-micro' });

  let recommendations: JobRecommendationsOutput;
  if (typeof response === 'string') {
    recommendations = JSON.parse(response);
  } else if (response.choices?.[0]?.message?.content) {
    recommendations = JSON.parse(response.choices[0].message.content);
  } else {
    throw new Error('Unexpected response format from Nexus');
  }

  return JobRecommendationsOutputSchema.parse(recommendations);
}
