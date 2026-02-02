// Dock Component Wrapper - Integrates dock with application components
const DockComponent = {
  dock: null,

  init() {
    this.createDockItems();
  },

  createDockItems() {
    const items = [
      {
        icon: 'M',
        label: 'Memify',
        className: 'memify-item',
        onClick: () => this.handleMemify()
      },
      {
        icon: 'S',
        label: 'Summary',
        className: 'summary-item',
        onClick: () => alert('Summary feature coming soon')
      },
      {
        icon: 'A',
        label: 'Analyze',
        className: 'analyze-item',
        onClick: () => alert('Analyze feature coming soon')
      },
      {
        icon: 'E',
        label: 'Export',
        className: 'export-item',
        onClick: () => this.handleExport()
      },
      {
        icon: 'B',
        label: 'Bookmark',
        className: 'bookmark-item',
        onClick: () => this.handleBookmark()
      }
    ];

    this.dock = new Dock(items, {
      magnification: 40,
      distance: 0,
      baseItemSize: 40
    });

    this.dock.appendTo('#dock-container');
  },

  async handleMemify() {
    if (!window.QaComponent) return;

    const memifyItem = this.dock.dockItems[0].element;

    // Check if already clicked
    if (memifyItem.dataset.disabled === 'true') {
      return;
    }

    const answerEl = window.QaComponent.getAnswerElement();
    const answerBox = window.QaComponent.getAnswerBoxElement();
    const answerText = answerEl.textContent;

    if (!answerText || answerText.trim() === "") {
      alert("Please get an answer first before diagramming.");
      return;
    }

    // Scroll to bottom
    const mainContent = document.getElementById("mainContent");
    if (mainContent) {
      mainContent.scrollTo({
        top: mainContent.scrollHeight,
        behavior: 'smooth'
      });
    }

    // Disable button
    this.disableMemifyButton();
    answerBox.classList.add("loading");
    window.QaComponent.setStatus("Diagramising...", true);

    try {
      const data = await API.diagramise(answerText);
      const text = data.answer || data.error || "No response.";

      // Create styled memify box
      const memifyBox = document.createElement("div");
      memifyBox.style.cssText = `
        margin: 20px 0;
        padding: 0;
        border-radius: 8px;
        background: #1a1d22;
        border: 1px solid #2a2f36;
        overflow: hidden;
      `;

      const heading = document.createElement("div");
      heading.style.cssText = `
        padding: 12px 16px;
        background: #2a2f36;
        border-bottom: 1px solid #2a2f36;
        font-weight: 600;
        color: #b0b5bc;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      `;
      heading.textContent = "Memify";

      const contentBox = document.createElement("div");
      contentBox.style.cssText = `
        padding: 16px;
        background: #0f1115;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #b0b5bc;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-x: auto;
        line-height: 1.4;
      `;
      contentBox.textContent = text;

      memifyBox.appendChild(heading);
      memifyBox.appendChild(contentBox);

      const existing = answerEl.innerHTML;
      answerEl.classList.remove("fade-in");
      answerEl.innerHTML = existing + memifyBox.outerHTML;
      answerEl.classList.add("fade-in");

      // Update saved response
      const responseId = window.QaComponent.getCurrentResponseId();
      window.QaComponent.updateResponse(responseId, {
        answer: answerEl.textContent,
        answerHTML: answerEl.innerHTML,
        hasMemeified: true
      });

      window.QaComponent.setStatus("Diagram ready.");
      window.QaComponent.updateGreetingState();
    } catch (error) {
      console.error("Memify fetch error:", error);
      const errorMsg = error.message || "Connection error. Please try again.";
      await Utils.typeMarkdown(`Error: ${errorMsg}`, answerEl, marked);
      window.QaComponent.setStatus("Error: " + errorMsg);
      window.QaComponent.updateGreetingState();
    } finally {
      answerBox.classList.remove("loading");
    }
  },

  handleExport() {
    if (!window.QaComponent) return;

    const answerEl = window.QaComponent.getAnswerElement();
    const input = document.getElementById("questionInput");
    const question = input?.value || "No question";
    const answer = answerEl.textContent;

    if (!answer || answer.trim() === "") {
      alert("Please get an answer first before exporting.");
      return;
    }

    // Create PDF using jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    const addWrappedText = (text, fontSize) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });
    };

    // Add title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Study Q&A Export', margin, yPosition);
    yPosition += 15;

    // Add date
    const now = new Date();
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    addWrappedText(`Generated: ${now.toLocaleString()}`, 10);
    yPosition += 5;

    // Add question
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Question:', margin, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    addWrappedText(question, 11);
    yPosition += 5;

    // Add separator
    doc.setDrawColor(200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Add response
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Response:', margin, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    addWrappedText(answer, 10);

    // Generate filename
    const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `StudyQA_${timestamp}_${Math.random().toString(36).substr(2, 5)}.pdf`;

    doc.save(filename);
    
    if (window.QaComponent) {
      window.QaComponent.setStatus("PDF exported successfully!");
    }
  },

  handleBookmark() {
    if (!window.QaComponent) return;

    const answerEl = window.QaComponent.getAnswerElement();
    const answerText = answerEl.textContent;

    if (!answerText || answerText.trim() === "") {
      alert("Please get an answer first before bookmarking.");
      return;
    }

    const savedResponses = Storage.loadQaResponses();
    if (savedResponses.length === 0) {
      alert("No saved responses found.");
      return;
    }

    // Toggle favorite on most recent
    savedResponses[0].isFavorite = !savedResponses[0].isFavorite;
    Storage.saveQaResponses(savedResponses);

    if (window.SidebarComponent) {
      window.SidebarComponent.renderQaHistory();
    }

    const isFav = savedResponses[0].isFavorite;
    alert(isFav ? "Added to favorites" : "Removed from favorites");
  },

  disableMemifyButton() {
    if (!this.dock) return;
    const memifyItem = this.dock.dockItems[0].element;
    memifyItem.dataset.disabled = 'true';
    memifyItem.style.opacity = '0.6';
    memifyItem.style.cursor = 'not-allowed';
  },

  resetMemifyButton() {
    if (!this.dock) return;
    const memifyItem = this.dock.dockItems[0].element;
    memifyItem.dataset.disabled = 'false';
    memifyItem.style.opacity = '1';
    memifyItem.style.cursor = 'pointer';
  }
};
