// PDF Component - Handles PDF file processing
const PdfComponent = {
  elements: {},

  init() {
    this.cacheElements();
    this.bindEvents();
  },

  cacheElements() {
    this.elements = {
      uploadBtn: document.getElementById("pdfUploadBtn"),
      input: document.getElementById("pdfInput")
    };
  },

  bindEvents() {
    const { uploadBtn, input } = this.elements;

    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        input?.click();
      });
    }

    if (input) {
      input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          this.processPdfFile(file);
        }
      });
    }
  },

  async processPdfFile(file) {
    const { uploadBtn, input } = this.elements;
    if (!file || !window.QaComponent) return;

    uploadBtn.classList.add("loading");
    uploadBtn.disabled = true;

    try {
      // Stage 1: Validation
      window.QaComponent.setStatus("Validating PDF...", true);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Stage 2: Parsing
      window.QaComponent.setStatus("Parsing PDF pages...", true);
      const pdfText = await this.parsePdf(file);

      if (!pdfText) {
        throw new Error("No text found in PDF");
      }

      // Stage 3: Complete extraction
      window.QaComponent.setStatus("PDF parsed - Text extracted", true);
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Stage 4: Prepare for AI
      window.QaComponent.state.hasAsked = true;
      const answerBox = window.QaComponent.getAnswerBoxElement();
      const answerEl = window.QaComponent.getAnswerElement();
      
      answerBox.classList.add("loading");
      answerEl.innerHTML = "";

      window.QaComponent.setStatus("Sending to DeepSeek API...", true);
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Stage 5: AI Summarization
      window.QaComponent.setStatus("DeepSeek is analyzing...", true);

      const summaryPrompt = `Please provide a comprehensive summary of the following text. Extract key points, main ideas, and important information:\n\n${pdfText}`;

      const data = await API.askQuestion(summaryPrompt);

      // Stage 6: Process response
      window.QaComponent.setStatus("Processing summary...", true);
      const summary = data.answer || "No summary generated.";

      // Stage 7: Render
      window.QaComponent.setStatus("Rendering summary...", true);
      await Utils.typeMarkdown(summary, answerEl, marked);

      // Stage 8: Save to history
      window.QaComponent.setStatus("Saving to history...", true);
      const pdfQuestion = `[PDF] ${file.name}`;

      const savedResponses = Storage.loadQaResponses();
      savedResponses.unshift({
        question: pdfQuestion,
        answer: summary,
        timestamp: new Date().toISOString()
      });

      if (savedResponses.length > 50) savedResponses.pop();
      Storage.saveQaResponses(savedResponses);

      if (window.SidebarComponent?.renderQaHistory) {
        window.SidebarComponent.renderQaHistory();
      }

      // Stage 9: Complete
      window.QaComponent.setStatus("PDF processed successfully!");
      window.QaComponent.updateGreetingState();
    } catch (error) {
      console.error("PDF processing error:", error);
      const answerEl = window.QaComponent.getAnswerElement();
      await Utils.typeMarkdown(`Error: ${error.message}`, answerEl, marked);
      window.QaComponent.setStatus("Failed to process PDF.");
      window.QaComponent.updateGreetingState();
    } finally {
      const answerBox = window.QaComponent.getAnswerBoxElement();
      answerBox.classList.remove("loading");
      uploadBtn.classList.remove("loading");
      uploadBtn.disabled = false;
      input.value = ""; // Reset file input
    }
  },

  async parsePdf(file) {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js library not loaded");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText.trim();
  }
};
