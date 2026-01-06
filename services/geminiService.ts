
import { GoogleGenAI, Type } from "@google/genai";
import { Stakeholder, Technology, TechNeed } from "../types";

// Interface for matchmaking results
export interface MatchResult {
  matchType: 'Technology' | 'Stakeholder' | 'Requirement';
  id: string;
  name: string;
  reason: string;
  confidenceScore: number;
}

/**
 * Perform AI matchmaking using Gemini 1.5 Flash.
 * Instantiates the client inside the function to pick up the most recent API key.
 */
export const getSmartMatches = async (
  userQuery: string,
  technologies: Technology[],
  needs: TechNeed[],
  stakeholders: Stakeholder[]
): Promise<MatchResult[]> => {
  // Always create a new instance right before the call to ensure valid API key usage
  const apiKey = (process.env.API_KEY || process.env.GEMINI_API_KEY || '').trim();

  // Diagnostic checks
  if (!apiKey) {
    throw new Error('API Key is missing. Please set GEMINI_API_KEY in .env.local');
  }

  if (apiKey.includes('HERE') || apiKey.includes('PLACEHOLDER') || apiKey.length < 30) {
    console.error(`Invalid API Key format detected. Length: ${apiKey.length}. Value looks like a placeholder.`);
    throw new Error(`Invalid API Key. The configured key (length: ${apiKey.length}) looks like a placeholder. Please ensure you have replaced GEMINI_API_KEY_HERE with a real key from Google AI Studio.`);
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-1.5-flash';

  const context = `
    You are a professional Technology Transfer Matchmaker for APCTT (Asian and Pacific Centre for Transfer of Technology).
    
    The platform database contains:
    Available Technologies (Supply): ${JSON.stringify(technologies.map(t => ({ id: t.id, name: t.name, desc: t.description })))}
    Available Requirements (Demand/Needs): ${JSON.stringify(needs.map(n => ({ id: n.id, title: n.title, desc: n.description, industry: n.industry })))}
    Available Stakeholders: ${JSON.stringify(stakeholders.map(s => ({ id: s.stakeholder_id, name: s.name, desc: s.description, cat: s.category })))}
    
    User Query: "${userQuery}"
    
    Your goal:
    1. Match the user's query to the most relevant Technologies, Requirements, or Stakeholders.
    2. If the user is looking for a solution, prioritize matching with Technologies.
    3. If the user is offering a solution, prioritize matching with Requirements (Needs).
    4. If the user is looking for partners in a specific area, match with Stakeholders.
    5. Return the top 4 most relevant matches.
    6. Ensure the ID matches EXACTLY with the data provided.
    7. Provide a concise "reason" explaining why it's a good match.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: context,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              matchType: { type: Type.STRING },
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              reason: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER }
            },
            required: ["matchType", "id", "name", "reason", "confidenceScore"]
          }
        }
      }
    });

    // Handle potential empty response
    if (!response.text) {
      console.warn("Gemini returned empty response text");
      return [];
    }

    try {
      return JSON.parse(response.text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, response.text);
      return [];
    }
  } catch (error: any) {
    console.error("Gemini Matchmaking Error:", error);
    // Propagate more descriptive errors if possible
    const errorMsg = error.message || 'Unknown AI error';
    if (errorMsg.includes('API key not valid')) {
      throw new Error('The Gemini API key provided in .env.local is not valid. Please check for typos or expiration.');
    }
    throw error;
  }
};
