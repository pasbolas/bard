// Todo Component - Handles todo list summarization
const TodoComponent = {
  elements: {},
  state: {
    hasAsked: false,
    history: [],
    placeholderHTML: '<div class="placeholder-text">Todo summarizer placeholder. Paste your list and you\'ll get a compact summary here.</div>'
  },

  init() {
    this.cacheElements();
    this.loadData();
    this.bindEvents();
    this.render();
  },

  cacheElements() {
    this.elements = {
      panel: document.getElementById("todoPanel"),
      input: document.getElementById("todoInput"),
      submitBtn: document.getElementById("todoSubmitBtn"),
      answerEl: document.getElementById("todoAnswer"),
      statusEl: document.getElementById("todoStatus")
    };
  },

  loadData() {
    this.state.history = Storage.loadTodoHistory();
  },

  bindEvents() {
    const { input, submitBtn } = this.elements;

    if (input) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          this.summarizeTodo();
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", (event) => {
        Utils.createRipple(event);
        this.summarizeTodo();
      });
    }
  },

  setStatus(text, isLoading = false) {
    const { statusEl } = this.elements;
    if (!statusEl) return;

    statusEl.innerHTML = isLoading
      ? `<span class="dot" aria-hidden="true"></span><span>${text}</span>`
      : `<span></span><span>${text}</span>`;
  },

  summarizeTodo() {
    const { input, answerEl } = this.elements;
    if (!input || !answerEl) return;

    const raw = input.value.trim();

    if (!raw) {
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      this.setStatus("Please paste a todo list first.");
      return;
    }

    const firstLine = raw.split("\n").find((line) => line.trim().length > 0) || "Todo Summary";
    const title = Utils.truncate(firstLine, 60);

    this.state.hasAsked = true;
    answerEl.innerHTML = this.state.placeholderHTML;
    answerEl.classList.add("popIn");
    this.setStatus("Summary ready.");
    this.addToHistory(this.state.placeholderHTML, title);
    input.value = "";
    this.updateGreetingState();
  },

  addToHistory(summaryHTML, title) {
    this.state.history.unshift({
      title,
      summaryHTML,
      timestamp: new Date().toISOString()
    });

    if (this.state.history.length > 50) {
      this.state.history.pop();
    }

    Storage.saveTodoHistory(this.state.history);
    
    if (window.SidebarComponent?.renderTodoHistory) {
      window.SidebarComponent.renderTodoHistory();
    }
  },

  updateGreetingState() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent || window.AppState?.activeMode !== "todo") return;

    const { answerEl } = this.elements;
    const hasAnswer = answerEl && answerEl.textContent.trim().length > 0;

    if (!this.state.hasAsked && !hasAnswer) {
      mainContent.classList.add("is-empty");
    } else {
      mainContent.classList.remove("is-empty");
    }
  },

  newTodo() {
    const { input, answerEl } = this.elements;
    
    if (input) {
      input.value = "";
      input.focus();
    }
    if (answerEl) {
      answerEl.innerHTML = this.state.placeholderHTML;
    }
    this.setStatus("Todo summarizer ready.");
    this.state.hasAsked = false;
    this.updateGreetingState();
  },

  render() {
    const { answerEl } = this.elements;
    this.setStatus("Todo summarizer ready.");
    if (answerEl && !answerEl.textContent.trim()) {
      answerEl.innerHTML = this.state.placeholderHTML;
    }
  },

  loadHistoryItem(summaryHTML) {
    const { answerEl } = this.elements;
    if (answerEl) {
      // Remove animation class to reset it
      answerEl.classList.remove("popIn");
      // Trigger reflow to restart animation
      void answerEl.offsetWidth;
      answerEl.innerHTML = summaryHTML || this.state.placeholderHTML;
      answerEl.classList.add("popIn");
    }
    this.setStatus("Loaded from todo history.");
    this.state.hasAsked = true;
    this.updateGreetingState();
  }
};
