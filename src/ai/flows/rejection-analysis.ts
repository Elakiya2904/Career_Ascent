'use server';

import { z } from 'zod';
import { callNexus } from '@/ai/nexus';

const RejectionAnalysisInputSchema = z.object({
  resumeText: z.string(), // changed from resumeDataUri
  jobTitle: z.string(),
});
export type RejectionAnalysisInput = z.infer<typeof RejectionAnalysisInputSchema>;

const RejectionAnalysisOutputSchema = z.object({
  reasons: z.array(
    z.object({
      reason: z.string(),
      suggestion: z.string(),
    })
  ),
});
export type RejectionAnalysisOutput = z.infer<typeof RejectionAnalysisOutputSchema>;

export async function rejectionAnalysis(
  input: RejectionAnalysisInput
): Promise<RejectionAnalysisOutput> {
  const prompt = `
You are an expert resume analyst. Analyze the resume text below for the job title "${input.jobTitle}" and identify potential reasons for rejection. For each reason, provide a constructive suggestion for improvement.

Resume:
${input.resumeText}

Respond in the following JSON format:
{
  "reasons": [
    {
      "reason": "",
      "suggestion": ""
    }
  ]
}
`;

  const response = await callNexus(prompt, { model: 'nova-micro' });

  let analysis: RejectionAnalysisOutput;
  if (typeof response === 'string') {
    analysis = JSON.parse(response);
  } else if (response.choices && response.choices[0]?.message?.content) {
    analysis = JSON.parse(response.choices[0].message.content);
  } else {
    throw new Error('Unexpected response format from Nexus');
  }

  return RejectionAnalysisOutputSchema.parse(analysis);
}
