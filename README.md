# Bard

Bard is your AI study buddy for school. Ask questions, summarize PDFs, and tame your todo list. Think of Bard as your friendly tutor who never says, "I am too busy." (Not the movie villain, promise.)

Small movie jokes included. No spoilers.

## What Bard Does

- Answers study questions in a chat-style Q&A.
- Summarizes PDFs like textbooks, notes, and papers.
- Shrinks messy todo lists into quick priorities.

If homework feels like a heist, Bard is your crew. But the nice kind. (No masks.)

## Features

- Q&A with favorites and history.
- PDF summaries.
- Todo list summarizer.
- Dock actions: memify, summarize, analyze, export, bookmark.

In short: Bard is the Frodo of your study journey. Small, helpful, and carrying the heavy stuff.

## Quick Start

Backend:
1. cd backend
2. npm install
3. Create .env:
   OPENAI_API_KEY=your_deepseek_api_key_here
4. node server.js

Server: http://localhost:3000

Frontend:
1. Open frontend.html in a browser.
2. Keep the backend running.

If you see a spinning circle forever, this is not Inception. Check the server.

## API

- POST /ask
  - Body: { "question": "your question here" }
  - Response: { "answer": "AI generated answer" }
- POST /diagramise
  - Body: { "text": "your text here" }
  - Response: { "answer": "ASCII art representation" }

## Data

- Stored in browser localStorage.
- Clearing browser data clears history.
- No accounts, no sync, just your device.

## Tips

- Ask clear questions. Bard is smart, not psychic.
- Use PDF summaries for long readings.
- Favorite what you want to revisit before exams.

## Troubleshooting

- No answers: backend not running or missing API key.
- PDF fails: try a text-based PDF.
- History missing: localStorage disabled or cleared.

If all else fails, do the classic movie move: turn it off and on again.

## Credits

- DeepSeek AI, GSAP, Marked.js, PDF.js, jsPDF

## License

Personal study tool. Use it for learning.
