import { localApiOnly } from './local-api-guard.mjs';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use('/api', localApiOnly(() => PORT));
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 1. Extract frames from script
app.post("/api/storyboard/extract", async (req, res) => {
  try {
    const { script } = req.body;
    if (!script) {
      return res.status(400).json({ error: "Script is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Extract a sequence of visual storyboard frames from the following script. For each frame, provide a short description and a detailed visual prompt describing what should be drawn.\n\nScript:\n${script}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "A short label or summary of the frame (e.g., 'Scene 1: Interior Office')",
              },
              prompt: {
                type: Type.STRING,
                description: "A detailed visual description for an image generation model.",
              },
            },
            required: ["description", "prompt"],
          },
        },
      },
    });

    const text = response.text;
    if (text) {
      const frames = JSON.parse(text);
      res.json({ frames });
    } else {
      res.status(500).json({ error: "Empty response from Gemini" });
    }
  } catch (error) {
    console.error("Error extracting frames:", error);
    res.status(500).json({ error: "Failed to extract frames" });
  }
});

// 2. Generate a storyboard image for a prompt
app.post("/api/storyboard/generate", async (req, res) => {
  try {
    const { prompt, size } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Must be "1K", "2K", "4K"
    const allowedSizes = ["1K", "2K", "4K"];
    const imageSize = allowedSizes.includes(size) ? size : "1K";

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [
          {
            text: `Storyboard frame, cinematic composition, professional sketch style, detailed: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: imageSize as any,
        },
      },
    });

    let base64Image = null;
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (base64Image) {
      res.json({ imageUrl: `data:image/jpeg;base64,${base64Image}` });
    } else {
      res.status(500).json({ error: "No image generated" });
    }
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// 3. Chat Assistant
app.post("/api/chat", async (req, res) => {
  try {
    const { history, message, modelType } = req.body;
    
    let model = "gemini-3.5-flash";
    if (modelType === "pro") model = "gemini-3.1-pro-preview";
    if (modelType === "lite") model = "gemini-3.1-flash-lite";

    // Format history for generateContent
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: "You are an AI Storyboard Director and Script Consultant. Your role is to help the user brainstorm scenes, write scripts, or provide styling instructions for cinematic boards. Offer concise and constructive feedback.",
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Error in chat:", error);
    res.status(500).json({ error: "Chat failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
