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

    this.dock.appendTo("#dock-container");
  },

  async handleMemify() {
    if (!window.QaComponent) return;

    const memifyItem = this.dock?.dockItems?.[0]?.element;
    if (!memifyItem) return;

    // Check if already clicked
    if (memifyItem.dataset.disabled === 'true') {
      return;
    }

    const threadEl = window.QaComponent.getChatThreadElement();
    const answerText = window.QaComponent.getLatestAssistantText();

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
    threadEl?.classList.add("loading");
    window.QaComponent.setStatus("Diagramising...", true);

    try {
      const data = await API.diagramise(answerText);
      const text = data.answer || data.error || "No response.";

      const memifyMarkdown = `### Memify\n\n\`\`\`\n${text}\n\`\`\``;
      window.QaComponent.appendAssistantMessage(memifyMarkdown);

      window.QaComponent.setStatus("Diagram ready.");
      window.QaComponent.updateGreetingState();
    } catch (error) {
      console.error("Memify fetch error:", error);
      const errorMsg = error.message || "Connection error. Please try again.";
      window.QaComponent.appendAssistantMessage(`Error: ${errorMsg}`);
      window.QaComponent.setStatus("Error: " + errorMsg);
      window.QaComponent.updateGreetingState();
    } finally {
      threadEl?.classList.remove("loading");
    }
  },

  handleExport() {
    if (!window.QaComponent) return;

    const conversationText = window.QaComponent.getConversationExportText();

    if (!conversationText || conversationText.trim() === "") {
      alert("Please start a conversation before exporting.");
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

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Conversation:', margin, yPosition);
    yPosition += 8;
    doc.setFont(undefined, 'normal');
    addWrappedText(conversationText, 10);

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

    const conversationId = window.QaComponent.getActiveConversationId();
    if (!conversationId) {
      alert("No conversation selected.");
      return;
    }

    window.QaComponent.toggleFavorite(conversationId);

    if (window.SidebarComponent) {
      window.SidebarComponent.renderQaHistory();
    }

    alert("Toggled favorite.");
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
