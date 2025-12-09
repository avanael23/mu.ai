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
    
    "dkl",
  ];

  if (reasoningKeywords.some((k) => lower.includes(k))) {
    return "reasoning";
  }

  return "search";
};

// small helper for delay
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const streamGeminiResponse = async (
  history: Content[],
  onChunk: (text: string) => void,
  manualMode?: ModelMode
) => {
  try {
    let mode = manualMode;

    // auto-detect mode from last user message if not provided
    if (!mode) {
      const lastMsg = history[history.length - 1];
      if (lastMsg && lastMsg.role === "user") {
        const textPart = (lastMsg.parts as any[]).find((p) => p.text);
        if (textPart && textPart.text) {
          mode = detectMode(textPart.text);
        }
      }
    }

    if (!mode) mode = "search";

    // 1) Call Netlify function ONCE
    const res = await fetch("/.netlify/functions/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, mode, systemPrompt: SYSTEM_PROMPT }),
    });

    if (!res.ok) {
      throw new Error("Gemini function HTTP error " + res.status);
    }

    const data = await res.json(); // { text }
    const fullText: string = data.text || "";

    // 2) "Fake stream" it in chunks to keep old UX & avoid freezing
    const chunkSize = 50;      // characters per update (tune if needed)
    const delayMs = 15;        // delay between chunks (tune if needed)

    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunk = fullText.slice(i, i + chunkSize);
      onChunk(chunk);
      // give React + browser time to breathe
      await sleep(delayMs);
    }
  } catch (error) {
    console.error("Gemini API Error (frontend):", error);
    throw error;
  }
};
