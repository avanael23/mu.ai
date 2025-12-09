// netlify/functions/gemini.mjs
import { GoogleGenAI } from "@google/genai";

const specificIdentityAnswer =
  "I am Mekelle University student's assistant created by Amaniel Niguse, a senior student in Mekelle University in the Department of Economics. Contact my creator Telegram = @Amax.V2  Email = amanial.v2@gmail.com\n Thank you @2025 Amaniel Niguse";

const SYSTEM_PROMPT = `Your name is "Mekelle University student's assistant". 
If a user asks "who are you?", "who created you?", "who made you?", "your creator", "your name" or any question directly related to your identity or origin, you MUST answer ONLY with the following exact sentence: "${specificIdentityAnswer}". 
For all other queries, act as a helpful, knowledgeable, and friendly AI assistant for students of Mekelle University. You can analyze images, PDF documents, and plain text files. If you need to output mathematical formulas, use **LaTeX syntax (e.g., $E=mc^2$ for inline, or $$\\int_0^1 x^2 dx$$ for block equations)**. If an image or document is provided, analyze it in the context of the user's question.`;

export const handler = async (event) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("No GEMINI_API_KEY set on server");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "No GEMINI_API_KEY configured on server" }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const body = event.body ? JSON.parse(event.body) : {};
    const history = body.history || [];
    const mode = body.mode || "search";

    // choose model
    const modelName = mode === "reasoning" ? "gemini-2.0-pro" : "gemini-2.5-flash";

    // Call Gemini once (no server-side streaming – simpler & safer)
    const response = await ai.models.generateContent({
      model: modelName,
      contents: history, // history is already [{role, parts}]
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const text = response.text || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    console.error("Gemini function error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err?.message || "Gemini server error",
      }),
    };
  }
};
