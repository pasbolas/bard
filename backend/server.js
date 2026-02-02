import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

/* middleware */
app.use(cors());
app.use(bodyParser.json());

/* DeepSeek client (using OpenAI SDK as per docs) */
const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.OPENAI_API_KEY
});

const content = "You are A buddy who only answers study related questions in a very friendly and helpful manner.";
const diagramContent = "You are a playful ASCII artist. Generate a funny ASCII response inspired by the provided text. Keep it short (max 12 lines), use only standard ASCII characters, and do not include backticks or markdown.";

/* helper function that actually returns the AI answer */
async function askAI(question) 
{
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: content },
      { role: "user", content: question }
    ],
  });

  return completion.choices[0].message.content;
}

async function diagramiseAI(text) 
{
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: diagramContent },
      { role: "user", content: text }
    ],
  });

  return completion.choices[0].message.content;
}

/* POST route */
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const answer = await askAI(question);

    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/diagramise", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const answer = await diagramiseAI(text);

    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* start server */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
