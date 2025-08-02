/**
 * @fileOverview Centralized Genkit initialization for the Nexus endpoint.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const nexusPlugin = googleAI({
  apiKey: process.env.NEXUS_API_KEY,
  apiEndpoint: process.env.NEXUS_BASE_URL,
});

export const ai = genkit({
  plugins: [nexusPlugin],
});
