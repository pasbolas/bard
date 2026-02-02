// Sidebar Component - Handles sidebar navigation and history
const SidebarComponent = {
  elements: {},
  state: {
    isMobile: false
  },

  init() {
    this.cacheElements();
    this.bindEvents();
    this.checkMobileState();
    this.render();
  },

  cacheElements() {
    this.elements = {
      sidebar: document.getElementById("sidebar"),
      sidebarToggle: document.getElementById("sidebarToggle"),
      sidebarOverlay: document.getElementById("sidebarOverlay"),
      sidebarCloseBtn: document.getElementById("sidebarCloseBtn"),
      qaSidebar: document.getElementById("qaSidebar"),
      todoSidebar: document.getElementById("todoSidebar"),
      favoritesList: document.getElementById("favoritesList"),
      savedList: document.getElementById("savedList"),
      todoHistoryList: document.getElementById("todoHistoryList"),
      qaModeBtn: document.getElementById("qaModeBtn"),
      todoModeBtn: document.getElementById("todoModeBtn"),
      newQueryBtn: document.getElementById("newQueryBtn"),
      resizer: document.getElementById("resizer")
    };
  },

  bindEvents() {
    const { sidebarToggle, sidebarOverlay, sidebarCloseBtn, qaModeBtn, todoModeBtn, newQueryBtn, resizer, sidebar } = this.elements;

    // Mode toggle
    if (qaModeBtn) {
      qaModeBtn.addEventListener("click", () => this.setMode("qa"));
    }

    if (todoModeBtn) {
      todoModeBtn.addEventListener("click", () => this.setMode("todo"));
    }

    // New query/todo button
    if (newQueryBtn) {
      newQueryBtn.addEventListener("click", () => this.handleNewAction());
    }

    // Mobile toggle
    if (sidebarToggle) {
      sidebarToggle.addEventListener("click", () => this.toggleSidebar());
    }

    // Overlay click
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener("click", () => this.closeSidebar());
    }

    // Close button
    if (sidebarCloseBtn) {
      sidebarCloseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeSidebar();
      });
    }

    // Prevent sidebar clicks from closing
    if (sidebar) {
      sidebar.addEventListener("click", (e) => e.stopPropagation());
    }

    // Resizer
    this.initResizer();

    // Window resize
    window.addEventListener("resize", () => this.checkMobileState());
  },

  initResizer() {
    const { resizer, sidebar } = this.elements;
    const layout = document.querySelector(".layout");
    let isResizing = false;
    const MIN_WIDTH = 240;
    const MAX_WIDTH = 520;
    const MAIN_MIN = 520;

    const getSidebarMaxWidth = () => {
      if (!layout || !resizer) return MAX_WIDTH;
      const layoutRect = layout.getBoundingClientRect();
      const resizerWidth = resizer.getBoundingClientRect().width || 0;
      const maxByLayout = layoutRect.width - MAIN_MIN - resizerWidth;
      return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, maxByLayout));
    };

    const clampWidth = (width) => {
      const maxWidth = getSidebarMaxWidth();
      return Math.min(maxWidth, Math.max(MIN_WIDTH, width));
    };

    resizer.addEventListener("mousedown", () => {
      isResizing = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const layoutRect = layout ? layout.getBoundingClientRect() : { left: 0 };
      const proposedWidth = e.clientX - layoutRect.left;
      const newWidth = clampWidth(proposedWidth);
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
      const clampedWidth = clampWidth(currentWidth);
      if (Math.abs(clampedWidth - currentWidth) > 1) {
        sidebar.style.width = `${clampedWidth}px`;
      }
    });
  },

  checkMobileState() {
    this.state.isMobile = window.innerWidth <= 768;
    const { sidebarToggle, sidebar, sidebarOverlay } = this.elements;

    if (sidebarToggle) {
      if (this.state.isMobile) {
        sidebarToggle.classList.add("show");
      } else {
        sidebarToggle.classList.remove("show");
        sidebar?.classList.remove("open");
        sidebarOverlay?.classList.remove("show");
      }
    }
  },

  toggleSidebar() {
    const { sidebar, sidebarOverlay, sidebarToggle } = this.elements;
    sidebar?.classList.toggle("open");
    sidebarOverlay?.classList.toggle("show");
    sidebarToggle?.classList.toggle("hide");
  },

  closeSidebar() {
    const { sidebar, sidebarOverlay, sidebarToggle } = this.elements;
    sidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");
    sidebarToggle?.classList.remove("hide");
  },

  closeSidebarIfMobile() {
    if (!this.state.isMobile) return;
    this.closeSidebar();
  },

  setMode(mode) {
    if (!mode || mode === window.AppState?.activeMode) return;

    window.AppState.activeMode = mode;
    this.updateModeButtons();

    const { qaSidebar, todoSidebar, newQueryBtn } = this.elements;
    const qaPanel = document.getElementById("qaPanel");
    const todoPanel = document.getElementById("todoPanel");

    if (qaPanel) qaPanel.classList.toggle("is-hidden", mode !== "qa");
    if (todoPanel) todoPanel.classList.toggle("is-hidden", mode !== "todo");
    if (qaSidebar) qaSidebar.classList.toggle("is-hidden", mode !== "qa");
    if (todoSidebar) todoSidebar.classList.toggle("is-hidden", mode !== "todo");

    if (newQueryBtn) {
      newQueryBtn.textContent = mode === "qa" ? "New Query" : "New Todo";
    }

    if (mode === "todo") {
      if (window.TodoComponent) {
        window.TodoComponent.render();
      }
    }

    // Update greeting state for active component
    if (mode === "qa" && window.QaComponent) {
      window.QaComponent.updateGreetingState();
    } else if (mode === "todo" && window.TodoComponent) {
      window.TodoComponent.updateGreetingState();
    }
  },

  updateModeButtons() {
    const { qaModeBtn, todoModeBtn } = this.elements;
    if (!qaModeBtn || !todoModeBtn) return;

    const isQa = window.AppState?.activeMode === "qa";
    qaModeBtn.classList.toggle("active", isQa);
    todoModeBtn.classList.toggle("active", !isQa);
    qaModeBtn.setAttribute("aria-selected", isQa ? "true" : "false");
    todoModeBtn.setAttribute("aria-selected", !isQa ? "true" : "false");
  },

  handleNewAction() {
    const mode = window.AppState?.activeMode;
    if (mode === "todo" && window.TodoComponent) {
      window.TodoComponent.newTodo();
    } else if (mode === "qa" && window.QaComponent) {
      window.QaComponent.newQuery();
    }
  },

  renderQaHistory() {
    const { favoritesList, savedList } = this.elements;
    const savedResponses = Storage.loadQaResponses();

    const favorites = savedResponses
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .filter((item) => item.isFavorite);
    const regular = savedResponses
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .filter((item) => !item.isFavorite);

    // Render Favorites
    if (favoritesList) {
      favoritesList.innerHTML = "";
      if (favorites.length === 0) {
        const empty = document.createElement("div");
        empty.className = "saved-item";
        empty.style.minHeight = "40px";
        empty.textContent = "No favorites yet.";
        favoritesList.appendChild(empty);
      } else {
        favorites.forEach((item) => {
          this.renderQaItem(item, item.originalIndex, favoritesList);
        });
      }
    }

    // Render History
    if (savedList) {
      savedList.innerHTML = "";
      if (regular.length === 0) {
        const empty = document.createElement("div");
        empty.className = "saved-item";
        empty.style.minHeight = "40px";
        empty.textContent = "No history yet.";
        savedList.appendChild(empty);
      } else {
        regular.forEach((item) => {
          this.renderQaItem(item, item.originalIndex, savedList);
        });
      }
    }
  },

  renderQaItem(item, index, container) {
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
    meta.textContent = Utils.formatDate(item.timestamp);

    content.appendChild(question);
    content.appendChild(meta);
    card.appendChild(content);

    // Action buttons
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "saved-item-actions";

    // Favorite button
    const favBtn = document.createElement("button");
    favBtn.className = `item-action-btn ${item.isFavorite ? "favorite" : ""}`;
    favBtn.innerHTML = item.isFavorite ? "★" : "☆";
    favBtn.title = item.isFavorite ? "Remove from favorites" : "Add to favorites";
    favBtn.onclick = (e) => {
      e.stopPropagation();
      this.toggleFavorite(index);
    };

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "item-action-btn";
    delBtn.innerHTML = "-";
    delBtn.title = "Delete";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      this.deleteQaResponse(index, card);
    };

    actionsDiv.appendChild(favBtn);
    actionsDiv.appendChild(delBtn);
    card.appendChild(actionsDiv);

    // Click to load
    card.addEventListener("click", () => {
      if (window.QaComponent) {
        const { elements } = window.QaComponent;
        elements.input.value = item.question || "";
        
        if (item.answerHTML) {
          elements.answerEl.innerHTML = item.answerHTML;
        } else {
          elements.answerEl.innerHTML = marked.parse(item.answer || "");
        }
        
        elements.answerEl.classList.add("fade-in");
        window.QaComponent.setStatus("Loaded from saved responses.");
        elements.submitBtn.style.display = "none";
        window.QaComponent.state.hasAsked = true;
        window.QaComponent.state.currentResponseId = item.id;

        // Update memify button state
        if (window.DockComponent && item.hasMemeified) {
          window.DockComponent.disableMemifyButton();
        } else if (window.DockComponent) {
          window.DockComponent.resetMemifyButton();
        }

        window.QaComponent.updateGreetingState();
        this.closeSidebarIfMobile();
      }
    });

    container.appendChild(card);
  },

  toggleFavorite(index) {
    const savedResponses = Storage.loadQaResponses();
    if (savedResponses[index]) {
      savedResponses[index].isFavorite = !savedResponses[index].isFavorite;
      Storage.saveQaResponses(savedResponses);
      this.renderQaHistory();
    }
  },

  deleteQaResponse(index, cardElement) {
    const savedResponses = Storage.loadQaResponses();
    
    // Highlight card
    if (cardElement) {
      cardElement.style.background = "rgba(217, 119, 6, 0.15)";
      cardElement.style.borderColor = "#d97706";
    }

    // Show confirmation (simplified for now)
    if (confirm("Delete this response?")) {
      savedResponses.splice(index, 1);
      Storage.saveQaResponses(savedResponses);
      this.renderQaHistory();
    } else if (cardElement) {
      cardElement.style.background = "";
      cardElement.style.borderColor = "";
    }
  },

  renderTodoHistory() {
    const { todoHistoryList } = this.elements;
    if (!todoHistoryList) return;

    const todoHistory = Storage.loadTodoHistory();
    todoHistoryList.innerHTML = "";

    if (!todoHistory.length) {
      const empty = document.createElement("div");
      empty.className = "saved-item";
      empty.style.minHeight = "40px";
      empty.textContent = "No todo history yet.";
      todoHistoryList.appendChild(empty);
      return;
    }

    todoHistory.forEach((item, index) => {
      const card = document.createElement("div");
      card.className = "saved-item";

      const content = document.createElement("div");
      content.style.flex = "1";

      const title = document.createElement("div");
      title.className = "saved-question";
      title.textContent = item.title || `Todo Summary ${todoHistory.length - index}`;

      const meta = document.createElement("div");
      meta.className = "saved-meta";
      meta.textContent = Utils.formatDate(item.timestamp);

      content.appendChild(title);
      content.appendChild(meta);
      card.appendChild(content);

      card.addEventListener("click", () => {
        if (window.TodoComponent) {
          window.TodoComponent.loadHistoryItem(item.summaryHTML);
          this.closeSidebarIfMobile();
        }
      });

      todoHistoryList.appendChild(card);
    });
  },

  render() {
    this.updateModeButtons();
    this.renderQaHistory();
    this.renderTodoHistory();
  }
};
