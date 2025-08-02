import axios from 'axios';

const NEXUS_API_KEY = process.env.NEXUS_API_KEY;
const NEXUS_BASE_URL = process.env.NEXUS_BASE_URL;

if (!NEXUS_API_KEY || !NEXUS_BASE_URL) {
  throw new Error("❌ NEXUS_API_KEY or NEXUS_BASE_URL is not defined in environment variables.");
}

// Optional: trim prompt to avoid token limit issues
function trimPrompt(prompt: string, maxLength = 5000) {
  return prompt.length > maxLength ? prompt.slice(0, maxLength) : prompt;
}

export async function callNexus(prompt: string, options?: { model?: string }) {
  const safePrompt = trimPrompt(prompt);

  const payload = {
    model: options?.model || 'nova-micro',
    messages: [
      {
        role: 'user',
        content: safePrompt,
      },
    ],
  };

  try {
    const response = await axios.post(NEXUS_BASE_URL!, payload, {
      headers: {
        Authorization: `Bearer ${NEXUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("❌ Axios error:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.message);
    console.error("Response data:", error.response?.data);
    console.error("Request payload:", payload);

    const detailedError =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      JSON.stringify(error.response?.data) ||
      error.message;

    throw new Error(`Nexus API call failed: ${detailedError}`);
  }
}
