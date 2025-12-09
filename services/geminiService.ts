import { Content } from "@google/genai";
import { ModelMode } from "../types";

const specificIdentityAnswer =
  "I am Mekelle University student's assistant created by Amaniel Niguse, a senior student in Mekelle University in the Department of Economics. Contact my creator Telegram = @Amax.V2  Email = amanial.v2@gmail.com\n Thank you @2025 Amaniel Niguse";

const SYSTEM_PROMPT = `Your name is "Mekelle University student's assistant". 
If a user asks "who are you?", "who created you?", "who made you?", "your creator", "your name" or any question directly related to your identity or origin, you MUST answer ONLY with the following exact sentence: "${specificIdentityAnswer}". 
For all other queries, act as a helpful, knowledgeable, and friendly AI assistant for students of Mekelle University. You can analyze images, PDF documents, and plain text files. If you need to output mathematical formulas, use **LaTeX syntax (e.g., $E=mc^2$ for inline, or $$\int_0^1 x^2 dx$$ for block equations)**. If an image or document is provided, analyze it in the context of the user's question.`;

export const detectMode = (prompt: string): ModelMode => {
  const lower = prompt.toLowerCase();

  const reasoningKeywords = [
    "solve",
    "calculate",
    "derive",
    "proof",
    "explain",
    "analyze",
    "code",
    "program",
    "function",
    "algorithm",
    "debug",
    "why",
    "how",
    "plan",
    "structure",
    "compare",
    "difference",
  ];

  if (reasoningKeywords.some((k) => lower.includes(k))) {
    return "reasoning";
  }

  return "search";
};

export const streamGeminiResponse = async (
  history: Content[],
  onChunk: (text: string) => void,
  manualMode?: ModelMode
) => {
  try {
    let mode = manualMode;

    if (!mode) {
      const lastMsg = history[history.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        const textPart = lastMsg.parts.find((p: any) => p.text);
        if (textPart && textPart.text) {
          mode = detectMode(textPart.text);
        }
      }
    }

    if (!mode) mode = "search";

    // Call Netlify function instead of Gemini directly
    const res = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, mode, systemPrompt: SYSTEM_PROMPT }),
    });

    if (!res.ok) {
      throw new Error("Gemini function HTTP error " + res.status);
    }

    const data = await res.json(); // { text }
    if (data.text) {
      onChunk(data.text); // push whole response as one chunk
    }
  } catch (error) {
    console.error("Gemini API Error (frontend):", error);
    throw error;
  }
};