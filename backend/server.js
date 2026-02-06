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

const content = "You are Bard, a friendly and helpful assistant. Keep answers concise and clear.";
const diagramContent = "You are a playful ASCII artist. Generate a funny ASCII response inspired by the provided text. Keep it short (max 12 lines), use only standard ASCII characters, and do not include backticks or markdown.";
const planContent = "You are a planning assistant. Given a list of todos with due times and the current time, produce a concise plan for the rest of the day. Use markdown with clear headings, bullet points, and time blocks. Keep it practical and prioritized.";

/* helper function that actually returns the AI answer */
async function askAI(question, messages = []) 
{
  const conversation = Array.isArray(messages) && messages.length > 0
    ? messages
    : [{ role: "user", content: question }];

  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: content },
      ...conversation
    ]
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

async function planDayAI(todos, currentTime) 
{
  const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: planContent },
      {
        role: "user",
        content: `Current time: ${currentTime}\nTodos:\n${JSON.stringify(todos, null, 2)}`
      }
    ]
  });

  return completion.choices[0].message.content;
}

/* POST route */
app.post("/ask", async (req, res) => {
  try {
    const { question, messages } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const answer = await askAI(question, messages);

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

app.post("/plan", async (req, res) => {
  try {
    const { todos, currentTime } = req.body;

    if (!Array.isArray(todos) || todos.length === 0) {
      return res.status(400).json({ error: "Todos are required" });
    }

    const plan = await planDayAI(todos, currentTime || new Date().toLocaleString());
    res.json({ plan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* start server */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
