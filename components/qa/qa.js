// Q&A Component - Handles question answering functionality
const QaComponent = {
  elements: {},
  state: {
    hasAsked: false,
    currentResponseId: null,
    savedResponses: []
  },

  init() {
    this.cacheElements();
    this.loadData();
    this.bindEvents();
    this.render();
  },

  cacheElements() {
    this.elements = {
      panel: document.getElementById("qaPanel"),
      input: document.getElementById("questionInput"),
      submitBtn: document.getElementById("submitBtn"),
      answerEl: document.getElementById("answer"),
      answerBox: document.getElementById("answerBox"),
      statusEl: document.getElementById("status"),
      newQueryBtn: document.getElementById("newQueryBtn")
    };
  },

  loadData() {
    this.state.savedResponses = Storage.loadQaResponses();
  },

  bindEvents() {
    const { input, submitBtn } = this.elements;

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && window.AppState?.activeMode === "qa") {
        this.askQuestion();
      }
    });

    submitBtn.addEventListener("click", (event) => {
      if (window.AppState?.activeMode !== "qa") return;
      Utils.createRipple(event);
      this.askQuestion();
    });
  },

  setStatus(text, isLoading = false) {
    const { statusEl } = this.elements;
    if (!statusEl) return;
    
    statusEl.innerHTML = isLoading
      ? `<span class="dot" aria-hidden="true"></span><span>${text}</span>`
      : `<span></span><span>${text}</span>`;
  },

  async askQuestion() {
    const { input, submitBtn, answerBox, answerEl } = this.elements;
    const question = input.value.trim();

    if (!question) {
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      this.setStatus("Please type a question first.");
      return;
    }

    this.state.hasAsked = true;
    input.value = "";
    submitBtn.disabled = true;
    answerBox.classList.add("loading");
    answerEl.innerHTML = "";
    this.setStatus("Thinking...", true);
    this.updateGreetingState();

    try {
      const data = await API.askQuestion(question);
      const text = data.answer || data.error || "No response.";
      await Utils.typeMarkdown(text, answerEl, marked);
      
      // Add pop-in animation
      answerEl.classList.add("popIn");
      
      // Generate unique ID for this response
      const responseId = Utils.generateId();
      
      this.state.savedResponses.unshift({
        id: responseId,
        question,
        answer: text,
        timestamp: new Date().toISOString()
      });

      if (this.state.savedResponses.length > 50) {
        this.state.savedResponses.pop();
      }

      Storage.saveQaResponses(this.state.savedResponses);
      this.state.currentResponseId = responseId;
      
      // Reset memify button for new response
      if (window.DockComponent?.resetMemifyButton) {
        window.DockComponent.resetMemifyButton();
      }
      
      if (window.SidebarComponent?.renderQaHistory) {
        window.SidebarComponent.renderQaHistory();
      }

      this.setStatus("Answer ready.");
      this.updateGreetingState();
    } catch (error) {
      console.error("Answer fetch error:", error);
      await Utils.typeMarkdown("Something went wrong. Please try again.", answerEl, marked);
      answerEl.classList.add("popIn");
      this.setStatus("Connection error: " + error.message);
      this.updateGreetingState();
    } finally {
      answerBox.classList.remove("loading");
      submitBtn.disabled = false;
    }
  },

  updateGreetingState() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent || window.AppState?.activeMode !== "qa") return;

    const { answerEl } = this.elements;
    const hasAnswer = answerEl && answerEl.textContent.trim().length > 0;

    if (!this.state.hasAsked && !hasAnswer) {
      mainContent.classList.add("is-empty");
    } else {
      mainContent.classList.remove("is-empty");
    }
  },

  newQuery() {
    const { input, submitBtn, answerEl } = this.elements;
    
    submitBtn.style.display = "";
    input.value = "";
    input.focus();
    answerEl.innerHTML = "";
    this.setStatus("Ready when you are.");
    this.state.hasAsked = false;
    this.updateGreetingState();
  },

  render() {
    this.setStatus("Ready when you are.");
  },

  getCurrentResponseId() {
    return this.state.currentResponseId;
  },

  updateResponse(responseId, updates) {
    const response = this.state.savedResponses.find(r => r.id === responseId);
    if (response) {
      Object.assign(response, updates);
      Storage.saveQaResponses(this.state.savedResponses);
    }
  },

  getAnswerElement() {
    return this.elements.answerEl;
  },

  getAnswerBoxElement() {
    return this.elements.answerBox;
  }
};
