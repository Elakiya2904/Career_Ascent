'use server';

/**
 * @fileOverview A resume rejection analysis AI agent.
 *
 * - rejectionAnalysis - A function that handles the resume rejection analysis process.
 * - RejectionAnalysisInput - The input type for the rejectionAnalysis function.
 * - RejectionAnalysisOutput - The return type for the rejectionAnalysis function.
 */
import {z} from 'zod';
import {ai} from '@/ai/nexus';

const RejectionAnalysisInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  jobTitle: z
    .string()
    .describe('The job title for which the resume was submitted.'),
});
export type RejectionAnalysisInput = z.infer<typeof RejectionAnalysisInputSchema>;

const RejectionAnalysisOutputSchema = z.object({
  reasons: z
    .array(
      z.object({
        reason: z
          .string()
          .describe('A potential reason for the resume being rejected.'),
        suggestion: z
          .string()
          .describe(
            'A specific suggestion on how to improve the resume to address the reason.'
          ),
      })
    )
    .describe(
      'A list of potential reasons for rejection and suggestions for improvement.'
    ),
});
export type RejectionAnalysisOutput = z.infer<typeof RejectionAnalysisOutputSchema>;

export async function rejectionAnalysis(
  input: RejectionAnalysisInput
): Promise<RejectionAnalysisOutput> {
  return rejectionAnalysisFlow(input);
}

const rejectionAnalysisPrompt = ai.definePrompt({
  name: 'rejectionAnalysisPrompt',
  input: {schema: RejectionAnalysisInputSchema},
  output: {schema: RejectionAnalysisOutputSchema},
  model: 'nova-mirco',
  prompt: `You are an expert resume analyst. Analyze the provided resume for the job title "{{jobTitle}}" and identify potential reasons for rejection. For each reason, provide a constructive suggestion for improvement.
Resume: {{media url=resumeDataUri}}`,
});

const rejectionAnalysisFlow = ai.defineFlow(
  {
    name: 'rejectionAnalysisFlow',
    inputSchema: RejectionAnalysisInputSchema,
    outputSchema: RejectionAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await rejectionAnalysisPrompt(input);
    return output!;
  }
);
