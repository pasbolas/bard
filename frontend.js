const input = document.getElementById("questionInput");
const answerEl = document.getElementById("answer");
const answerBox = document.getElementById("answerBox");
const submitBtn = document.getElementById("submitBtn");
const pdfUploadBtn = document.getElementById("pdfUploadBtn");
const pdfInput = document.getElementById("pdfInput");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");
const savedListEl = document.getElementById("savedList");
const newQueryBtn = document.getElementById("newQueryBtn");
const glow = document.querySelector(".glow");
const sidebar = document.getElementById("sidebar");
const resizer = document.getElementById("resizer");
const mainContent = document.getElementById("mainContent");
const layout = document.querySelector(".layout");

const recentQuestions = [];
const STORAGE_KEY = "studyqa:savedResponses";
let savedResponses = loadSavedResponses();
let hasAsked = false;
let currentResponseId = null; // Track the current response ID for memify

// Resizable sidebar functionality
let isResizing = false;
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 520;
const MAIN_MIN_WIDTH = 520;

function getSidebarMaxWidth() {
  if (!layout || !resizer) return SIDEBAR_MAX_WIDTH;
  const layoutRect = layout.getBoundingClientRect();
  const resizerWidth = resizer.getBoundingClientRect().width || 0;
  const maxByLayout = layoutRect.width - MAIN_MIN_WIDTH - resizerWidth;
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, maxByLayout));
}

function clampSidebarWidth(width) {
  const maxWidth = getSidebarMaxWidth();
  return Math.min(maxWidth, Math.max(SIDEBAR_MIN_WIDTH, width));
}

resizer.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;

  const layoutRect = layout ? layout.getBoundingClientRect() : { left: 0 };
  const proposedWidth = e.clientX - layoutRect.left;
  const newWidth = clampSidebarWidth(proposedWidth);
  if (newWidth > 0) {
    sidebar.style.width = `${newWidth}px`;
  }
});

document.addEventListener("mouseup", () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }
});

window.addEventListener("resize", () => {
  if (!sidebar) return;
  const currentWidth = sidebar.getBoundingClientRect().width;
  const clampedWidth = clampSidebarWidth(currentWidth);
  if (Math.abs(clampedWidth - currentWidth) > 1) {
    sidebar.style.width = `${clampedWidth}px`;
  }
});

function setStatus(text, isLoading = false) {
  statusEl.innerHTML = isLoading
    ? `<span class="dot" aria-hidden="true"></span><span>${text}</span>`
    : `<span></span><span>${text}</span>`;
}

function updateGreetingState() {
  if (!mainContent) return;
  const hasAnswer = answerEl.textContent.trim().length > 0;
  if (!hasAsked && !hasAnswer) {
    mainContent.classList.add("is-empty");
  } else {
    mainContent.classList.remove("is-empty");
  }
}

function loadSavedResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistSavedResponses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResponses, null, 2));
}

function renderSavedResponses() {
  const favoritesList = document.getElementById("favoritesList");
  
  // Separate favorites and regular items
  const favorites = savedResponses.map((item, idx) => ({ ...item, originalIndex: idx })).filter(item => item.isFavorite);
  const regular = savedResponses.map((item, idx) => ({ ...item, originalIndex: idx })).filter(item => !item.isFavorite);

  // Render Favorites section
  favoritesList.innerHTML = "";
  if (favorites.length === 0) {
    const empty = document.createElement("div");
    empty.className = "saved-item";
    empty.style.minHeight = "40px";
    empty.textContent = "No favorites yet.";
    favoritesList.appendChild(empty);
  } else {
    favorites.forEach((item) => {
      renderSavedItem(item, item.originalIndex, favoritesList, true);
    });
  }

  // Render History section
  savedListEl.innerHTML = "";
  if (regular.length === 0) {
    const empty = document.createElement("div");
    empty.className = "saved-item";
    empty.style.minHeight = "40px";
    empty.textContent = "No history yet.";
    savedListEl.appendChild(empty);
    return;
  }

  regular.forEach((item) => {
    renderSavedItem(item, item.originalIndex, savedListEl, false);
  });
}

function renderSavedItem(item, index, container, isFavorite) {
  const card = document.createElement("div");
  card.className = "saved-item";

  const content = document.createElement("div");
  content.style.flex = "1";
  content.style.paddingRight = "60px";

  const question = document.createElement("div");
  question.className = "saved-question";
  question.textContent = item.question || "Untitled question";

  const meta = document.createElement("div");
  meta.className = "saved-meta";
  meta.textContent = new Date(item.timestamp).toLocaleString();

  content.appendChild(question);
  content.appendChild(meta);
  card.appendChild(content);

  // Add action buttons
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "saved-item-actions";

  // Favorite button
  const favBtn = document.createElement("button");
  favBtn.className = `item-action-btn ${item.isFavorite ? "favorite" : ""}`;
  favBtn.innerHTML = item.isFavorite ? "★" : "☆";
  favBtn.title = item.isFavorite ? "Remove from favorites" : "Add to favorites";
  favBtn.onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(index);
  };

  // Delete button
  const delBtn = document.createElement("button");
  delBtn.className = "item-action-btn";
  delBtn.innerHTML = "-";
  delBtn.title = "Delete";
  delBtn.onclick = (e) => {
    e.stopPropagation();
    deleteResponse(index, card);
  };

  actionsDiv.appendChild(favBtn);
  actionsDiv.appendChild(delBtn);
  card.appendChild(actionsDiv);

  // Click to load response
  card.addEventListener("click", () => {
    input.value = item.question || "";
    // Use stored HTML if available (preserves styling like memify blocks), otherwise parse the text
    if (item.answerHTML) {
      answerEl.innerHTML = item.answerHTML;
    } else {
      answerEl.innerHTML = marked.parse(item.answer || "");
    }
    answerEl.classList.add("fade-in");
    setStatus("Loaded from saved responses.");
    submitBtn.style.display = "none";
    hasAsked = true;
    
    // Set current response ID for memify tracking
    currentResponseId = item.id;
    
    // Disable memify button if this response has already been memeified
    const memifyItem = dock.dockItems[0].element;
    if (item.hasMemeified) {
      memifyItem.dataset.disabled = 'true';
      memifyItem.style.opacity = '0.6';
      memifyItem.style.cursor = 'not-allowed';
    } else {
      memifyItem.dataset.disabled = 'false';
      memifyItem.style.opacity = '1';
      memifyItem.style.cursor = 'pointer';
    }
    
    updateGreetingState();
    closeSidebarIfMobile();
  });

  container.appendChild(card);
}

function toggleFavorite(index) {
  if (savedResponses[index]) {
    savedResponses[index].isFavorite = !savedResponses[index].isFavorite;
    persistSavedResponses();
    renderSavedResponses();
  }
}

function deleteResponse(index, cardElement) {
  // Get the delete button that triggered this
  const deleteBtn = event.target;
  const rect = deleteBtn.getBoundingClientRect();

  // Highlight the chat card
  if (cardElement) {
    cardElement.style.background = "rgba(217, 119, 6, 0.15)";
    cardElement.style.borderColor = "#d97706";
  }

  // Create custom confirmation popup
  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed;
    top: ${rect.top + rect.height + 8}px;
    right: ${window.innerWidth - rect.right}px;
    background: #15181d;
    border: 1px solid #2a2f36;
    border-radius: 6px;
    padding: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
    z-index: 10000;
    min-width: 200px;
    backdrop-filter: blur(10px);
  `;

  // Add message
  const message = document.createElement("div");
  message.style.cssText = `
    color: #e5e7eb;
    font-size: 12px;
    margin-bottom: 12px;
    line-height: 1.4;
  `;
  message.textContent = "Delete this response?";
  popup.appendChild(message);

  // Add buttons container
  const buttonsDiv = document.createElement("div");
  buttonsDiv.style.cssText = `
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  `;

  // Cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.style.cssText = `
    padding: 6px 12px;
    background: #2a2f36;
    color: #b0b5bc;
    border: 1px solid #2a2f36;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 160ms ease;
  `;
  cancelBtn.textContent = "Cancel";
  cancelBtn.onmouseover = () => {
    cancelBtn.style.background = "rgba(42, 47, 54, 0.8)";
  };
  cancelBtn.onmouseout = () => {
    cancelBtn.style.background = "#2a2f36";
  };
  cancelBtn.onclick = () => {
    // Remove highlight
    if (cardElement) {
      cardElement.style.background = "transparent";
      cardElement.style.borderColor = "#2a2f36";
    }
    document.body.removeChild(popup);
  };

  // Delete button
  const confirmBtn = document.createElement("button");
  confirmBtn.style.cssText = `
    padding: 6px 12px;
    background: #d97706;
    color: white;
    border: 1px solid #d97706;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: all 160ms ease;
  `;
  confirmBtn.textContent = "Delete";
  confirmBtn.onmouseover = () => {
    confirmBtn.style.background = "#b8670f";
  };
  confirmBtn.onmouseout = () => {
    confirmBtn.style.background = "#d97706";
  };
  confirmBtn.onclick = () => {
    savedResponses.splice(index, 1);
    persistSavedResponses();
    renderSavedResponses();
    setStatus("Response deleted.");
    document.body.removeChild(popup);
  };

  buttonsDiv.appendChild(cancelBtn);
  buttonsDiv.appendChild(confirmBtn);
  popup.appendChild(buttonsDiv);

  document.body.appendChild(popup);

  // Close popup when clicking outside
  const closePopup = (e) => {
    if (!popup.contains(e.target) && e.target !== deleteBtn) {
      // Remove highlight if not confirmed
      if (cardElement) {
        cardElement.style.background = "transparent";
        cardElement.style.borderColor = "#2a2f36";
      }
      document.body.removeChild(popup);
      document.removeEventListener("click", closePopup);
    }
  };
  
  setTimeout(() => {
    document.addEventListener("click", closePopup);
  }, 0);
}

function createRipple(event) {
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  const rect = submitBtn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  submitBtn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

function addHistory(question) {
  if (!question) return;
  if (!historyEl) return;
  if (recentQuestions.includes(question)) return;
  recentQuestions.unshift(question);
  if (recentQuestions.length > 5) recentQuestions.pop();

  historyEl.innerHTML = "";
  recentQuestions.forEach((q) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = q;
    chip.addEventListener("click", () => {
      input.value = q;
      input.focus();
    });
    historyEl.appendChild(chip);
  });
}

function updateGlow(event) {
  const x = (event.clientX / window.innerWidth) * 100;
  const y = (event.clientY / window.innerHeight) * 100;
  glow.style.setProperty("--mx", `${x}%`);
  glow.style.setProperty("--my", `${y}%`);
}

async function typeAnswerMarkdown(text) {
  answerEl.classList.remove("fade-in");
  answerEl.innerHTML = "";

  let buffer = "";
  for (let i = 0; i < text.length; i += 1) {
    buffer += text[i];
    if (i % 3 === 0) {
      answerEl.innerHTML = marked.parse(buffer);
      await new Promise((resolve) => setTimeout(resolve, 6));
    }
  }

  answerEl.innerHTML = marked.parse(buffer);
  answerEl.classList.add("fade-in");
}

async function processPdfFile(file) {
  if (!file) return;

  pdfUploadBtn.classList.add("loading");
  pdfUploadBtn.disabled = true;
  
  try {
    // Stage 1: File validation
    setStatus("Validating PDF...", true);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Stage 2: Parsing PDF
    setStatus("Parsing PDF pages...", true);
    const pdfText = await parsePdfFile(file);
    
    if (!pdfText) {
      throw new Error("No text found in PDF");
    }

    // Stage 3: Text extraction complete
    setStatus("PDF parsed - Text extracted", true);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Stage 4: Preparing for summarization
    hasAsked = true;
    answerBox.classList.add("loading");
    answerEl.innerHTML = "";
    
    setStatus("Sending to DeepSeek API...", true);
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stage 5: AI Summarization
    setStatus("DeepSeek is analyzing...", true);
    
    const summaryPrompt = `Please provide a comprehensive summary of the following text. Extract key points, main ideas, and important information:\n\n${pdfText}`;
    
    const response = await fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: summaryPrompt })
    });

    if (!response.ok) {
      throw new Error("Failed to summarize PDF");
    }

    // Stage 6: Processing response
    setStatus("Processing summary...", true);
    const data = await response.json();
    const summary = data.answer || "No summary generated.";
    
    // Stage 7: Rendering
    setStatus("Rendering summary...", true);
    await typeAnswerMarkdown(summary);
    
    // Stage 8: Saving to history
    setStatus("Saving to history...", true);
    const pdfQuestion = `[PDF] ${file.name}`;
    addHistory(pdfQuestion);
    savedResponses.unshift({
      question: pdfQuestion,
      answer: summary,
      timestamp: new Date().toISOString()
    });
    if (savedResponses.length > 50) savedResponses.pop();
    persistSavedResponses();
    renderSavedResponses();
    
    // Stage 9: Complete
    setStatus("PDF processed successfully!");
    updateGreetingState();

  } catch (error) {
    console.error("PDF processing error:", error);
    await typeAnswerMarkdown(`Error: ${error.message}`);
    setStatus("Failed to process PDF.");
    updateGreetingState();
  } finally {
    answerBox.classList.remove("loading");
    pdfUploadBtn.classList.remove("loading");
    pdfUploadBtn.disabled = false;
    pdfInput.value = ""; // Reset file input
  }
}

async function askQuestion() {
  const question = input.value.trim();

  if (!question) {
    input.classList.remove("shake");
    void input.offsetWidth;
    input.classList.add("shake");
    setStatus("Please type a question first.");
    return;
  }

  hasAsked = true;
  input.value = "";
  submitBtn.disabled = true;
  answerBox.classList.add("loading");
  answerEl.innerHTML = "";
  setStatus("Thinking...", true);
  updateGreetingState();

  try {
    const response = await fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const text = data.answer || data.error || "No response.";
    await typeAnswerMarkdown(text);
    addHistory(question);
    
    // Generate unique ID for this response
    const responseId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    savedResponses.unshift({
      id: responseId,
      question,
      answer: text,
      timestamp: new Date().toISOString()
    });
    if (savedResponses.length > 50) savedResponses.pop();
    persistSavedResponses();
    
    // Set the current response ID for memify tracking
    currentResponseId = responseId;
    
    // Reset memify button for new response
    const memifyItem = dock.dockItems[0].element;
    memifyItem.dataset.disabled = 'false';
    memifyItem.style.opacity = '1';
    memifyItem.style.cursor = 'pointer';
    
    renderSavedResponses();
    setStatus("Answer ready.");
    updateGreetingState();
  } catch (error) {
    console.error("Answer fetch error:", error);
    await typeAnswerMarkdown("Something went wrong. Please try again.");
    setStatus("Connection error: " + error.message);
    updateGreetingState();
  } finally {
    answerBox.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    askQuestion();
  }
});


submitBtn.addEventListener("click", (event) => {
  createRipple(event);
  askQuestion();
});

document.addEventListener("mousemove", updateGlow);

// Magnetic hover effect for submit button (moved after event listeners)
// Magnetic hover effect removed - no longer following cursor

renderSavedResponses();

setStatus("Ready when you are.");

if (newQueryBtn) {
  newQueryBtn.addEventListener("click", () => {
    submitBtn.style.display = "";
    input.value = "";
    input.focus();
    answerEl.innerHTML = "";
    setStatus("Ready when you are.");
    hasAsked = false;
    updateGreetingState();
  });
}
updateGreetingState();

// Initialize Dock with Memify and other options
const dock = new Dock(
  [
    {
      icon: 'M',
      label: 'Memify',
      className: 'memify-item',
      onClick: () => {
        const memifyItem = dock.dockItems[0].element;
        
        // Check if already clicked
        if (memifyItem.dataset.disabled === 'true') {
          return;
        }
        
        const answerText = answerEl.textContent;
        if (!answerText || answerText.trim() === "") {
          alert("Please get an answer first before diagramming.");
          return;
        }

        // Scroll to bottom smoothly
        const mainContent = document.getElementById("mainContent");
        if (mainContent) {
          mainContent.scrollTo({
            top: mainContent.scrollHeight,
            behavior: 'smooth'
          });
        }

        // Disable the button
        memifyItem.dataset.disabled = 'true';
        memifyItem.style.opacity = '0.6';
        memifyItem.style.cursor = 'not-allowed';
        answerBox.classList.add("loading");
        setStatus("Diagramising...", true);

        fetch("http://localhost:3000/diagramise", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ text: answerText })
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then(async (data) => {
            try {
              const text = data.answer || data.error || "No response.";
              
              // Create a styled memify box
              const memifyBox = document.createElement("div");
              memifyBox.style.cssText = `
                margin: 20px 0;
                padding: 0;
                border-radius: 8px;
                background: #1a1d22;
                border: 1px solid #2a2f36;
                overflow: hidden;
              `;
              
              // Add heading
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
              
              // Add ASCII art content in a box
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
              
              // Save the updated response with ASCII to localStorage using the response ID
              const responseToUpdate = savedResponses.find(r => r.id === currentResponseId);
              if (responseToUpdate) {
                responseToUpdate.answer = answerEl.textContent;
                responseToUpdate.answerHTML = answerEl.innerHTML;
                responseToUpdate.hasMemeified = true;
                persistSavedResponses();
              }
              
              // Permanently disable the memify button
              memifyItem.dataset.disabled = 'true';
              memifyItem.style.opacity = '0.6';
              memifyItem.style.cursor = 'not-allowed';
              
              setStatus("Diagram ready.");
              updateGreetingState();
            } catch (err) {
              console.error("Error processing memify response:", err);
              throw err;
            }
          })
          .catch(async (error) => {
            console.error("Memify fetch error:", error);
            const errorMsg = error.message || "Connection error. Please try again.";
            await typeAnswerMarkdown(`Error: ${errorMsg}`);
            setStatus("Error: " + errorMsg);
            updateGreetingState();
          })
          .finally(() => {
            answerBox.classList.remove("loading");
          });
      }
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
      onClick: () => {
        const question = input.value || "No question";
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

        // Set up document properties
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (2 * margin);
        let yPosition = margin;

        // Helper function to add wrapped text
        const addWrappedText = (text, fontSize, fontStyle = 'normal', isBold = false) => {
          doc.setFontSize(fontSize);
          if (isBold) {
            doc.setFont(undefined, 'bold');
          } else {
            doc.setFont(undefined, fontStyle);
          }
          
          const lines = doc.splitTextToSize(text, maxWidth);
          lines.forEach((line) => {
            if (yPosition > pageHeight - margin) {
              doc.addPage();
              yPosition = margin;
            }
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });
          doc.setFont(undefined, 'normal');
        };

        // Add title
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('Study Q&A Export', margin, yPosition);
        yPosition += 15;

        // Add date and time
        const now = new Date();
        const dateTimeString = now.toLocaleString();
        addWrappedText(`Generated: ${dateTimeString}`, 10);
        yPosition += 5;

        // Add question
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Question:', margin, yPosition);
        yPosition += 8;
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
        addWrappedText(answer, 10);

        // Generate filename with timestamp
        const timestamp = now.toISOString().slice(0, 10).replace(/-/g, '');
        const filename = `StudyQA_${timestamp}_${Math.random().toString(36).substr(2, 5)}.pdf`;

        // Auto-download
        doc.save(filename);
        
        setStatus("PDF exported successfully!");
      }
    },
    {
      icon: 'B',
      label: 'Bookmark',
      className: 'bookmark-item',
      onClick: () => {
        const answerText = answerEl.textContent;
        if (!answerText || answerText.trim() === "") {
          alert("Please get an answer first before bookmarking.");
          return;
        }

        // Find the first saved response (most recent)
        if (savedResponses.length === 0) {
          alert("No saved responses found.");
          return;
        }

        // Toggle favorite on the most recent response
        const mostRecentIndex = 0;
        toggleFavorite(mostRecentIndex);
        
        const isFav = savedResponses[mostRecentIndex].isFavorite;
        alert(isFav ? "Added to favorites" : "Removed from favorites");
      }
    }
  ],
  {
    magnification: 40,
    distance: 0,
    baseItemSize: 40
  }
);

dock.appendTo('#dock-container');

// Mobile sidebar responsiveness
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");
let isMobile = window.innerWidth <= 768;

function closeSidebarIfMobile() {
  if (!isMobile) return;
  sidebar.classList.remove("open");
  if (sidebarOverlay) sidebarOverlay.classList.remove("show");
  if (sidebarToggle) sidebarToggle.classList.remove("hide");
}

function updateMobileUI() {
  isMobile = window.innerWidth <= 768;
  if (sidebarToggle) {
    if (isMobile) {
      sidebarToggle.classList.add("show");
    } else {
      sidebarToggle.classList.remove("show");
      sidebar.classList.remove("open");
      if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    }
  }
}

window.addEventListener("resize", updateMobileUI);

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    if (sidebarOverlay) sidebarOverlay.classList.toggle("show");
    // Hide toggle button when sidebar is open, show when closed
    sidebarToggle.classList.toggle("hide");
  });
}

// Prevent sidebar clicks from closing the sidebar
if (sidebar) {
  sidebar.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
    // Show toggle button when sidebar closes
    if (sidebarToggle) sidebarToggle.classList.remove("hide");
  });
}

// Close sidebar with the close button
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
if (sidebarCloseBtn) {
  sidebarCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    if (sidebarToggle) sidebarToggle.classList.remove("hide");
  });
}

// Close sidebar when clicking a saved item on mobile
const originalRenderSavedResponses = renderSavedResponses;
renderSavedResponses = function() {
  originalRenderSavedResponses.call(this);

  if (isMobile) {
    const savedItems = document.querySelectorAll(".saved-item");
    savedItems.forEach(item => {
      item.addEventListener("click", () => {
        setTimeout(() => {
          closeSidebarIfMobile();
        }, 100);
      });
    });
  }
};

// Initial setup
updateMobileUI();
// PDF Upload functionality
if (pdfUploadBtn) {
  pdfUploadBtn.addEventListener("click", () => {
    pdfInput.click();
  });
}

if (pdfInput) {
  pdfInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      processPdfFile(file);
    }
  });
}