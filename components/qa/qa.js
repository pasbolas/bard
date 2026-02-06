// Q&A Component - Conversational chat thread
const QaComponent = {
  elements: {},
  state: {
    hasAsked: false,
    conversations: [],
    activeConversationId: null,
    typingEl: null
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
      threadEl: document.getElementById("chatThread"),
      statusEl: document.getElementById("status"),
      newQueryBtn: document.getElementById("newQueryBtn")
    };
  },

  loadData() {
    this.state.conversations = Storage.loadQaConversations();

    if (!this.state.conversations.length) {
      const convo = this.createConversation();
      this.state.conversations = [convo];
      this.state.activeConversationId = convo.id;
      Storage.saveQaConversations(this.state.conversations);
      return;
    }

    const mostRecent = this.state.conversations
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    this.state.activeConversationId = mostRecent?.id || this.state.conversations[0].id;
    const active = this.getActiveConversation();
    this.state.hasAsked = !!active && active.messages.length > 0;
  },

  bindEvents() {
    const { input, submitBtn } = this.elements;

    if (input) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey && window.AppState?.activeMode === "qa") {
          event.preventDefault();
          this.askQuestion();
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", (event) => {
        if (window.AppState?.activeMode !== "qa") return;
        Utils.createRipple(event);
        this.askQuestion();
      });
    }
  },

  createConversation() {
    const now = new Date().toISOString();
    return {
      id: Utils.generateId(),
      title: "New chat",
      messages: [],
      createdAt: now,
      updatedAt: now,
      isFavorite: false
    };
  },

  getActiveConversation() {
    return this.state.conversations.find((item) => item.id === this.state.activeConversationId) || null;
  },

  setActiveConversation(conversationId) {
    this.state.conversations = Storage.loadQaConversations();
    this.state.activeConversationId = conversationId;
    this.renderThread();
    this.updateGreetingState();
  },

  saveConversations() {
    Storage.saveQaConversations(this.state.conversations);
  },

  setStatus(text, isLoading = false) {
    const { statusEl } = this.elements;
    if (!statusEl) return;

    statusEl.innerHTML = isLoading
      ? `<span class="dot" aria-hidden="true"></span><span>${text}</span>`
      : `<span></span><span>${text}</span>`;
  },

  async askQuestion() {
    const { input, submitBtn, threadEl } = this.elements;
    const question = input?.value.trim();
    const pdfContext = window.PdfComponent?.getPdfContext?.();
    const hasPdf = !!pdfContext?.text;

    if (!question) {
      input?.classList.remove("shake");
      void input?.offsetWidth;
      input?.classList.add("shake");
      this.setStatus("Please type a question first.");
      return;
    }

    const conversation = this.getActiveConversation() || this.createAndActivateConversation();
    const now = new Date().toISOString();

    input.value = "";
    submitBtn.disabled = true;

    this.addMessageToConversation(conversation, {
      role: "user",
      content: question,
      timestamp: now
    });

    this.renderThread();
    this.scrollThreadToBottom();

    try {
      this.setStatus("Thinking...", true);
      this.showTypingIndicator();

      const messages = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const previousUserMessage = [...conversation.messages]
        .reverse()
        .find((msg, index) => msg.role === "user" && index > 0);

      const recentWindow = conversation.messages.slice(-8).map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      const contextPayload = {
        lastUserMessage: previousUserMessage?.content || "",
        recentMessages: recentWindow
      };

      const contextMessage = {
        role: "system",
        content: `Context JSON: ${JSON.stringify(contextPayload)}`
      };

      const messagesForApi = messages.map((msg) => ({ ...msg }));

      if (hasPdf) {
        const enriched = `Instructions:\n${question}\n\nPDF File: ${pdfContext.name || "uploaded.pdf"}\n\nPDF Content:\n${pdfContext.text}`;
        for (let i = messagesForApi.length - 1; i >= 0; i -= 1) {
          if (messagesForApi[i].role === "user") {
            messagesForApi[i].content = enriched;
            break;
          }
        }
      }

      const data = await API.askQuestion(question, [contextMessage, ...messagesForApi]);
      const text = data.answer || data.error || "No response.";

      this.hideTypingIndicator();
      await this.appendAssistantMessageAnimated(text);
      this.setStatus("Answer ready.");
    } catch (error) {
      console.error("Answer fetch error:", error);
      this.hideTypingIndicator();
      this.addMessageToConversation(conversation, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date().toISOString()
      });
      this.renderThread();
      this.scrollThreadToBottom();
      this.setStatus("Connection error: " + error.message);
    } finally {
      this.hideTypingIndicator();
      submitBtn.disabled = false;
      this.updateGreetingState();

      if (window.SidebarComponent?.renderQaHistory) {
        window.SidebarComponent.renderQaHistory();
      }
    }
  },

  addMessageToConversation(conversation, message) {
    conversation.messages.push(message);
    conversation.updatedAt = new Date().toISOString();

    if (message.role === "user") {
      this.state.hasAsked = true;
    }

    if (conversation.title === "New chat" && message.role === "user") {
      conversation.title = Utils.truncate(message.content, 48);
    }

    this.saveConversations();
  },

  createAndActivateConversation() {
    const convo = this.createConversation();
    this.state.conversations.unshift(convo);
    this.state.activeConversationId = convo.id;
    this.saveConversations();
    return convo;
  },

  renderThread() {
    const { threadEl } = this.elements;
    if (!threadEl) return;

    const conversation = this.getActiveConversation();
    threadEl.innerHTML = "";

    if (!conversation || conversation.messages.length === 0) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = "Start a new conversation.";
      threadEl.appendChild(empty);
      return;
    }

    conversation.messages.forEach((message) => {
      const row = document.createElement("div");
      row.className = `chat-message ${message.role}`;

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";

      const content = document.createElement("div");
      content.className = "chat-content";

      if (message.role === "assistant") {
        content.innerHTML = marked.parse(message.content || "");
      } else {
        content.textContent = message.content || "";
      }

      bubble.appendChild(content);
      row.appendChild(bubble);
      threadEl.appendChild(row);
    });
  },

  showTypingIndicator() {
    const { threadEl } = this.elements;
    if (!threadEl || this.state.typingEl) return;

    const row = document.createElement("div");
    row.className = "chat-message assistant is-typing";

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";

    const content = document.createElement("div");
    content.className = "chat-content";
    content.innerHTML = "<span class=\"typing-dots\"><span></span><span></span><span></span></span>";

    bubble.appendChild(content);
    row.appendChild(bubble);
    threadEl.appendChild(row);

    this.state.typingEl = row;
    this.scrollThreadToBottom();
  },

  hideTypingIndicator() {
    if (!this.state.typingEl) return;
    this.state.typingEl.remove();
    this.state.typingEl = null;
  },

  scrollThreadToBottom() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent) return;
    mainContent.scrollTo({
      top: mainContent.scrollHeight,
      behavior: "smooth"
    });
  },

  updateGreetingState() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent || window.AppState?.activeMode !== "qa") return;

    const conversation = this.getActiveConversation();
    const hasMessages = conversation && conversation.messages.length > 0;

    if (!this.state.hasAsked && !hasMessages) {
      mainContent.classList.add("is-empty");
    } else {
      mainContent.classList.remove("is-empty");
    }
  },

  newQuery() {
    const { input } = this.elements;
    const convo = this.createConversation();
    this.state.conversations.unshift(convo);
    this.state.activeConversationId = convo.id;
    this.state.hasAsked = false;
    this.saveConversations();

    if (input) {
      input.value = "";
      input.focus();
    }

    this.renderThread();
    this.setStatus("Ready when you are.");
    this.updateGreetingState();

    if (window.SidebarComponent?.renderQaHistory) {
      window.SidebarComponent.renderQaHistory();
    }
  },

  render() {
    this.setStatus("Ready when you are.");
    this.renderThread();
    this.updateGreetingState();
  },

  getChatThreadElement() {
    return this.elements.threadEl;
  },

  getActiveConversationId() {
    return this.state.activeConversationId;
  },

  getLatestAssistantMessageElement() {
    const thread = this.elements.threadEl;
    if (!thread) return null;
    const messages = thread.querySelectorAll(".chat-message.assistant .chat-content");
    return messages.length ? messages[messages.length - 1] : null;
  },

  getLatestAssistantText() {
    const conversation = this.getActiveConversation();
    if (!conversation) return "";
    const last = [...conversation.messages].reverse().find((msg) => msg.role === "assistant");
    return last?.content || "";
  },

  getConversationMessages() {
    const conversation = this.getActiveConversation();
    if (!conversation) return [];
    return conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }));
  },

  appendUserMessage(content) {
    const conversation = this.getActiveConversation() || this.createAndActivateConversation();
    this.addMessageToConversation(conversation, {
      role: "user",
      content,
      timestamp: new Date().toISOString()
    });
    this.renderThread();
    this.scrollThreadToBottom();
  },

  appendAssistantMessage(content) {
    const conversation = this.getActiveConversation() || this.createAndActivateConversation();
    this.addMessageToConversation(conversation, {
      role: "assistant",
      content,
      timestamp: new Date().toISOString()
    });
    this.renderThread();
    this.scrollThreadToBottom();
  },

  async appendAssistantMessageAnimated(content) {
    const conversation = this.getActiveConversation() || this.createAndActivateConversation();
    this.addMessageToConversation(conversation, {
      role: "assistant",
      content,
      timestamp: new Date().toISOString()
    });

    this.renderThread();

    const target = this.getLatestAssistantMessageElement();
    if (!target) {
      this.scrollThreadToBottom();
      return;
    }

    target.innerHTML = "";
    await Utils.typeMarkdown(content, target, marked);
    this.scrollThreadToBottom();
  },

  toggleFavorite(conversationId) {
    const convo = this.state.conversations.find((item) => item.id === conversationId);
    if (!convo) return;
    convo.isFavorite = !convo.isFavorite;
    this.saveConversations();
  },

  deleteConversation(conversationId) {
    const wasActive = conversationId === this.state.activeConversationId;
    this.state.conversations = this.state.conversations.filter((item) => item.id !== conversationId);

    if (!this.state.conversations.length) {
      const convo = this.createConversation();
      this.state.conversations = [convo];
      this.state.activeConversationId = convo.id;
    } else if (wasActive) {
      this.state.activeConversationId = this.state.conversations[0].id;
    }

    this.saveConversations();
    this.renderThread();
    this.updateGreetingState();
  },

  getConversationExportText() {
    const conversation = this.getActiveConversation();
    if (!conversation) return "";
    return conversation.messages
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");
  }
};
