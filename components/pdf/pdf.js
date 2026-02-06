// PDF Component - Handles PDF file processing
const PdfComponent = {
  state: {
    pdfText: "",
    fileName: ""
  },
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

      // Stage 4: Store parsed PDF for later use
      this.state.pdfText = pdfText;
      this.state.fileName = file.name;

      window.QaComponent.appendUserMessage(`[PDF] ${file.name} loaded`);
      window.QaComponent.setStatus("PDF ready. Add instructions and click Ask.");
      window.QaComponent.updateGreetingState();
    } catch (error) {
      console.error("PDF processing error:", error);
      window.QaComponent.appendAssistantMessage(`Error: ${error.message}`);
      window.QaComponent.setStatus("Failed to process PDF.");
      window.QaComponent.updateGreetingState();
    } finally {
      uploadBtn.classList.remove("loading");
      uploadBtn.disabled = false;
      input.value = ""; // Reset file input
    }
  },

  getPdfContext() {
    return {
      text: this.state.pdfText,
      name: this.state.fileName
    };
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
