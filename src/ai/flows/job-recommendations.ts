'use server';

/**
 * @fileOverview A job recommendation AI agent.
 *
 * - jobRecommendations - A function that suggests jobs based on a resume.
 * - JobRecommendationsInput - The input type for the jobRecommendations function.
 * - JobRecommendationsOutput - The return type for the jobRecommendations function.
 */
import {z} from 'zod';
import {ai} from '@/ai/nexus';

const JobRecommendationsInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The user's resume, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type JobRecommendationsInput = z.infer<typeof JobRecommendationsInputSchema>;

const JobRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(
      z.object({
        jobTitle: z.string().describe('The title of the recommended job.'),
        company: z.string().describe('The company offering the job.'),
        reasoning: z
          .string()
          .describe(
            'The reasoning behind why this job is a good fit for the user based on their resume.'
          ),
      })
    )
    .describe('A list of job recommendations with reasoning for each job.'),
});
export type JobRecommendationsOutput = z.infer<typeof JobRecommendationsOutputSchema>;

export async function jobRecommendations(
  input: JobRecommendationsInput
): Promise<JobRecommendationsOutput> {
  return jobRecommendationsFlow(input);
}

const jobRecommendationsPrompt = ai.definePrompt({
  name: 'jobRecommendationsPrompt',
  input: {schema: JobRecommendationsInputSchema},
  output: {schema: JobRecommendationsOutputSchema},
  model: 'nova-mirco',
  prompt: `You are an expert job market analyst. Based on the attached resume, recommend three suitable job titles and companies. For each recommendation, provide a clear reason why the candidate is a good fit.
Resume: {{media url=resumeDataUri}}`,
});

const jobRecommendationsFlow = ai.defineFlow(
  {
    name: 'jobRecommendationsFlow',
    inputSchema: JobRecommendationsInputSchema,
    outputSchema: JobRecommendationsOutputSchema,
  },
  async (input) => {
    const {output} = await jobRecommendationsPrompt(input);
    return output!;
  }
);
