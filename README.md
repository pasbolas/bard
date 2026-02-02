# Study Q&A Application

A web application designed to help students with their studies using AI assistance. This app provides an interactive Q&A interface, PDF document processing, and a todo list summarizer.

## What Does This App Do?

This application helps students in three main ways:

1. **Ask Questions**: Type any study-related question and get AI-powered answers
2. **Process PDFs**: Upload PDF files (textbooks, notes, papers) and the app will summarize them automatically
3. **Organize Tasks**: Paste your todo list and get a compact summary to help prioritize your work

## Features Explained

### Q&A Mode

The main feature of this app. You can ask any study-related question and receive helpful answers.

**How it works:**
- Type your question in the input field
- Click the "Ask" button or press Enter
- The AI processes your question and provides a detailed answer
- All questions and answers are saved in the sidebar history
- You can mark important answers as favorites for quick access later

**Special features:**
- Markdown support: Answers can include formatted text, code blocks, lists, and links
- Animated typing effect: Answers appear with a smooth typing animation
- Persistent storage: Your history is saved locally so you can return to it anytime
- PDF upload: Click the PDF button to upload and process PDF documents

### Todo Summarizer Mode

A separate workspace for managing and summarizing todo lists.

**How it works:**
- Switch to Todo mode using the toggle button in the sidebar
- Paste your todo list (any format works)
- Click "Summarize" to get a condensed version
- The summary helps you see priorities at a glance
- All summaries are saved in a separate history

**When to use it:**
- When you have a long list of tasks and need to focus
- To organize assignments and deadlines
- To track study goals across multiple subjects

### PDF Processing

Upload PDF files directly and get AI-generated summaries.

**How it works:**
- Click the "PDF" button in the Q&A interface
- Select a PDF file from your computer
- The app extracts all text from the PDF
- The text is automatically sent to the AI
- You receive a comprehensive summary of the document

**Supported documents:**
- Textbooks and chapters
- Research papers
- Study notes
- Lecture slides
- Any text-based PDF

**Processing stages:**
1. File upload
2. Reading PDF structure
3. Extracting text from each page
4. Combining all content
5. Sending to AI for analysis
6. Generating summary
7. Displaying result

### Sidebar History

Both Q&A and Todo modes have their own history sections.

**Q&A History features:**
- Favorites section: Quick access to starred responses
- Full history: All previous questions and answers
- Click any item to reload it in the main view
- Delete unwanted entries
- Star/unstar to move items between favorites and history

**Todo History features:**
- All previous todo summaries
- Click to reload any summary
- Delete old entries
- Completely separate from Q&A history

### Dock Interface

The bottom dock provides quick actions for the current response.

**Available actions:**

1. **Memify**: Converts the current answer into a fun ASCII art representation
2. **Summary**: Creates a brief summary of longer answers
3. **Analyze**: Provides deeper analysis of the current topic
4. **Export**: Download the current answer as a PDF file
5. **Bookmark**: Quickly save the current response to favorites

**Note**: Some actions (like Memify) are only available after you receive an answer.

### Visual Effects

The app includes several visual enhancements to make studying more enjoyable:

- **Aurora background**: Animated gradient background that shifts colors
- **Glow effect**: The cursor creates a subtle glow that follows your mouse
- **Orbs**: Floating animated elements in the background
- **Ripple effect**: Buttons create a ripple animation when clicked
- **Smooth animations**: All transitions are animated for a polished feel

## Project Structure

```
study/
├── components/               # Modular JavaScript components
│   ├── shared/              # Utilities used across the app
│   │   ├── storage.js       # Local storage management
│   │   ├── api.js           # Backend communication
│   │   └── utils.js         # Helper functions
│   ├── qa/                  # Q&A feature
│   │   ├── qa.js           # Q&A logic
│   │   └── qa.css          # Q&A styles
│   ├── todo/                # Todo summarizer
│   │   ├── todo.js         # Todo logic
│   │   └── todo.css        # Todo styles
│   ├── sidebar/             # Sidebar navigation
│   │   ├── sidebar.js      # Sidebar logic
│   │   └── sidebar.css     # Sidebar styles
│   ├── pdf/                 # PDF processing
│   │   ├── pdf.js          # PDF handling
│   │   └── pdf.css         # PDF button styles
│   └── dock/                # Bottom dock
│       ├── dock.js         # Dock component
│       ├── dock-wrapper.js # Dock integration
│       └── dock.css        # Dock styles
├── styles/                  # Global stylesheets
│   ├── base.css            # Variables, resets, global effects
│   └── layout.css          # Main layout structure
├── backend/                 # Server-side code
│   ├── server.js           # Express server with AI integration
│   └── package.json        # Backend dependencies
├── main.js                  # Application entry point
├── frontend.html            # Main HTML file
├── aurora.js                # Aurora background effect
├── gradual-blur.js          # Blur effect
└── shiny-text.js            # Text animation effect
```

## How the Code is Organized

The application follows a modular architecture where each feature is separated into its own component.

**Shared utilities** (components/shared/):
- **storage.js**: Handles saving and loading data from browser storage
- **api.js**: Manages communication with the backend server
- **utils.js**: Contains reusable functions like animations and date formatting

**Component structure**:
Each component (Q&A, Todo, Sidebar, etc.) has:
- A JavaScript file with the component's logic
- A CSS file with the component's styles
- Clear separation of concerns (UI updates, data handling, events)

**Main application** (main.js):
- Initializes all components in the correct order
- Sets up global event listeners
- Coordinates communication between components

## Technology Stack

**Frontend:**
- HTML5 for structure
- CSS3 with custom properties for styling
- Vanilla JavaScript for interactivity (no frameworks)
- GSAP for advanced animations
- Marked.js for markdown rendering
- PDF.js for PDF file processing
- jsPDF for PDF export

**Backend:**
- Node.js runtime
- Express.js web framework
- DeepSeek AI API (using OpenAI SDK)
- CORS for cross-origin requests

## Setup Instructions

### Backend Setup

1. Navigate to the backend folder:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend folder with your API key:
   ```
   OPENAI_API_KEY=your_deepseek_api_key_here
   ```

4. Start the server:
   ```
   node server.js
   ```

The server will run on http://localhost:3000

### Frontend Setup

1. Open `frontend.html` in a web browser
2. Make sure the backend server is running
3. Start using the application

**Note**: You need to run the backend server first, otherwise the Q&A features will not work.

## How Data is Stored

All your data is stored locally in your browser using localStorage. This means:

**Advantages:**
- Works offline (except for asking new questions)
- Your data stays private on your device
- No account or login required
- Instant access to history

**What gets stored:**
- All Q&A responses with questions and answers
- Todo summaries and their history
- Favorite status for Q&A items
- UI preferences (like sidebar width)

**Important:**
- Clearing browser data will delete your history
- Data is not synced across devices
- Each browser stores data separately

## API Endpoints

The backend provides two main endpoints:

**POST /ask**
- Purpose: Get AI answers to study questions
- Request body: `{ "question": "your question here" }`
- Response: `{ "answer": "AI generated answer" }`

**POST /diagramise**
- Purpose: Generate ASCII art from text
- Request body: `{ "text": "your text here" }`
- Response: `{ "answer": "ASCII art representation" }`

## Browser Compatibility

This application works best on modern browsers:
- Chrome (recommended)
- Firefox
- Edge
- Safari

**Requirements:**
- JavaScript enabled
- localStorage support
- CSS Grid and Flexbox support
- ES6+ JavaScript features

## Tips for Students

**Getting better answers:**
- Be specific in your questions
- Provide context when needed
- Break complex topics into smaller questions
- Use the PDF feature to summarize long readings

**Organizing your work:**
- Use favorites for important topics you need to review
- The todo summarizer helps with time management
- Export important answers as PDFs for offline study
- Review your history before exams

**Best practices:**
- Keep the backend server running while using the app
- Regularly export important answers as backup
- Use clear, descriptive questions for better history organization
- Take advantage of markdown formatting in answers

## Troubleshooting

**App not responding to questions:**
- Check if the backend server is running
- Verify the API key in the `.env` file
- Check browser console for error messages

**PDF upload not working:**
- Make sure the file is a valid PDF
- Check if the PDF contains extractable text (not just images)
- Try a different PDF file

**History not saving:**
- Check if browser localStorage is enabled
- Make sure you're not in incognito/private mode
- Check browser storage quota

**Visual effects not working:**
- Update to a modern browser version
- Check if hardware acceleration is enabled
- Try disabling browser extensions that might interfere

## Future Development Ideas

Possible features that could be added:
- Export history as JSON for backup
- Import/export between devices
- Dark/light theme toggle
- Custom AI system prompts
- Voice input for questions
- Image upload support
- Collaborative study sessions
- Spaced repetition flashcards from Q&A history

## Credits

**Libraries and APIs used:**
- DeepSeek AI for intelligent responses
- GSAP for smooth animations
- Marked.js for markdown parsing
- PDF.js by Mozilla for PDF processing
- jsPDF for PDF generation

## License

This is a personal study tool. Use it freely for educational purposes.
