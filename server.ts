import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API client lazy load
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        aiClient = new GoogleGenAI({ apiKey });
      }
    }
    return aiClient;
  }

  // Health route
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // AI Command processing route
  app.post("/api/command", async (req, res) => {
    try {
      const { command, currentRoom, worldModel } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Rule-based fallback if GEMINI_API_KEY is not set
        return res.json({
          fallback: true,
          actionResultText: `Executed command: ${command}`,
          explorerRecommendation: "Examine the inscriptions or light the torch brackets to reveal hidden mechanisms."
        });
      }

      const prompt = `You are the Temple Guardian AI and Archaeological Guide for 'The Lost Temple of Rudra'.
Current Chamber: ${currentRoom.title} (${currentRoom.chapter})
User Command: "${command}"
Current World Metrics: Torch=${worldModel?.evaluation?.torch}%, Resolve=${worldModel?.evaluation?.resolve}, Favor=${worldModel?.evaluation?.templeFavor}.

Respond with a JSON object containing:
- "narration": Atmospheric, sensory description of what happens next in the chamber (2-3 sentences).
- "templeAiEvaluation": A brief cryptic judgment from the Temple Guardian.
- "explorerRecommendation": Archaeologist advice for the next step.
- "actionResultText": Summary of physical result.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text;
      if (responseText) {
        try {
          const jsonRes = JSON.parse(responseText);
          return res.json(jsonRes);
        } catch {
          return res.json({ narration: responseText });
        }
      }

      return res.json({
        narration: `The ancient stones of the ${currentRoom.title} acknowledge your presence.`,
      });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      return res.json({
        narration: "The temple's energy fluctuates, but your resolve remains intact.",
        actionResultText: "Command processed."
      });
    }
  });

  // Vite middleware for dev or static serving for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Temple Server running on http://localhost:${PORT}`);
  });
}

startServer();
