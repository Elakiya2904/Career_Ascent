'use server';

/**
 * @fileOverview This file defines a flow for analyzing a resume against a job description.
 *
 * - analyzeResume - The function to call to analyze a resume.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The output type for the analyzeResume function.
 */
import {z} from 'zod';
import {ai} from '@/ai/nexus';

const AnalyzeResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  jobTitle: z
    .string()
    .describe('The job title to compare the resume against.'),
});
export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  matchScore: z
    .number()
    .describe(
      'A score indicating how well the resume matches the job title, from 0 to 100.'
    ),
  analysis: z
    .string()
    .describe('An analysis of the resume in relation to the job title.'),
  suggestions: z
    .array(
      z.object({
        point: z.string().describe('A point of improvement for the resume.'),
        suggestion: z
          .string()
          .describe(
            'A specific suggestion on how to improve the resume to address the point.'
          ),
      })
    )
    .describe('A list of suggestions to improve the resume.'),
});
export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

export async function analyzeResume(
  input: AnalyzeResumeInput
): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const analyzeResumePrompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  model: 'nova-mirco',
  prompt: `You are an expert resume analyst. Analyze the provided resume and determine its match score for the job title: "{{jobTitle}}". Provide a detailed analysis and actionable suggestions for improvement.
Resume: {{media url=resumeDataUri}}`,
});

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchema,
    outputSchema: AnalyzeResumeOutputSchema,
  },
  async (input) => {
    const {output} = await analyzeResumePrompt(input);
    return output!;
  }
);
