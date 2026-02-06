// Todo Component - Handles single-entry todo list
const TodoComponent = {
  elements: {},
  state: {
    items: [],
    editingId: null
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
      timeInput: document.getElementById("todoDueTime"),
      submitBtn: document.getElementById("todoSubmitBtn"),
      listEl: document.getElementById("todoList"),
      answerEl: document.getElementById("todoAnswer"),
      statusEl: document.getElementById("todoStatus"),
      plannerBtn: document.getElementById("plannerBtn"),
      plannerContent: document.getElementById("plannerContent")
    };
  },

  loadData() {
    this.state.items = Storage.loadTodoItems();
  },

  bindEvents() {
    const { input, timeInput, submitBtn, listEl, plannerBtn } = this.elements;

    if (input) {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.addTodo();
        }
      });
    }

    if (timeInput) {
      timeInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          this.addTodo();
        }
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", (event) => {
        Utils.createRipple(event);
        this.addTodo();
      });
    }

    if (listEl) {
      listEl.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const row = button.closest(".todo-item");
        if (!row) return;
        const itemId = row.dataset.id;

        switch (button.dataset.action) {
          case "edit":
            this.startEdit(itemId);
            break;
          case "save":
            this.saveEdit(itemId, row);
            break;
          case "toggle":
            this.toggleComplete(itemId);
            break;
          case "delete":
            this.deleteTodo(itemId);
            break;
          default:
            break;
        }
      });

      listEl.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        const row = event.target.closest(".todo-item");
        if (!row) return;
        if (this.state.editingId === row.dataset.id) {
          event.preventDefault();
          this.saveEdit(row.dataset.id, row);
        }
      });
    }

    if (plannerBtn) {
      plannerBtn.addEventListener("click", () => {
        this.requestPlan();
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

  addTodo() {
    const { input, timeInput } = this.elements;
    if (!input || !timeInput) return;

    const text = input.value.trim();
    const dueTime = timeInput.value;

    if (!text) {
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      this.setStatus("Please add a todo first.");
      return;
    }

    if (!dueTime) {
      timeInput.classList.remove("shake");
      void timeInput.offsetWidth;
      timeInput.classList.add("shake");
      this.setStatus("Please select a due time.");
      return;
    }

    this.state.items.push({
      id: Utils.generateId(),
      text,
      dueTime,
      completed: false,
      createdAt: new Date().toISOString()
    });

    input.value = "";
    timeInput.value = "";
    this.saveItems();
    this.renderList();
    this.setStatus("Todo added.");
    this.updateGreetingState();
  },

  startEdit(itemId) {
    this.state.editingId = itemId;
    this.renderList();
  },

  saveEdit(itemId, row) {
    const textInput = row.querySelector(".todo-edit-input");
    const timeInput = row.querySelector(".todo-edit-time");
    if (!textInput || !timeInput) return;

    const text = textInput.value.trim();
    const dueTime = timeInput.value;

    if (!text || !dueTime) {
      if (!text) {
        textInput.classList.remove("shake");
        void textInput.offsetWidth;
        textInput.classList.add("shake");
      }
      if (!dueTime) {
        timeInput.classList.remove("shake");
        void timeInput.offsetWidth;
        timeInput.classList.add("shake");
      }
      this.setStatus("Please enter both task and time.");
      return;
    }

    const item = this.state.items.find((entry) => entry.id === itemId);
    if (item) {
      item.text = text;
      item.dueTime = dueTime;
    }

    this.state.editingId = null;
    this.saveItems();
    this.renderList();
    this.setStatus("Todo updated.");
  },

  toggleComplete(itemId) {
    const item = this.state.items.find((entry) => entry.id === itemId);
    if (!item) return;
    item.completed = !item.completed;
    this.saveItems();
    this.renderList();
    this.setStatus(item.completed ? "Marked complete." : "Marked active.");
  },

  deleteTodo(itemId) {
    this.state.items = this.state.items.filter((entry) => entry.id !== itemId);
    this.state.editingId = null;
    this.saveItems();
    this.renderList();
    this.setStatus("Todo removed.");
    this.updateGreetingState();
  },

  saveItems() {
    Storage.saveTodoItems(this.state.items);
  },

  updateGreetingState() {
    const mainContent = document.getElementById("mainContent");
    if (!mainContent || window.AppState?.activeMode !== "todo") return;

    if (this.state.items.length === 0) {
      mainContent.classList.add("is-empty");
    } else {
      mainContent.classList.remove("is-empty");
    }
  },

  newTodo() {
    const { input, timeInput, answerEl } = this.elements;

    if (input) {
      input.value = "";
      input.focus();
    }
    if (timeInput) {
      timeInput.value = "";
    }
    if (answerEl) {
      answerEl.innerHTML = "";
    }

    this.state.items = [];
    this.state.editingId = null;
    this.saveItems();
    this.renderList();
    this.setStatus("Todo list cleared.");
    this.updateGreetingState();
  },

  async requestPlan() {
    const { plannerContent } = this.elements;
    if (!plannerContent) return;

    if (this.state.items.length === 0) {
      plannerContent.classList.remove("is-loading");
      plannerContent.innerHTML = "<div class=\"planner-empty\">Add todos to generate a plan.</div>";
      this.setStatus("Add at least one todo to plan your day.");
      return;
    }

    const payload = this.state.items.map((item) => ({
      text: item.text,
      dueTime: item.dueTime,
      completed: item.completed,
      status: item.completed ? "completed" : "pending"
    }));

    try {
      this.setStatus("Planning your day...", true);
      plannerContent.innerHTML = "";
      plannerContent.classList.add("is-loading");

      const currentTime = new Date().toLocaleString();
      const response = await API.planDay(payload, currentTime);
      const markdown = response?.plan || response?.answer || response?.error || "No plan returned.";
      plannerContent.innerHTML = marked.parse(markdown);
      plannerContent.classList.remove("is-loading");
      this.setStatus("Plan ready.");
    } catch (error) {
      console.error("Plan request failed:", error);
      plannerContent.classList.remove("is-loading");
      plannerContent.innerHTML = "<div class=\"planner-empty\">Unable to generate a plan.</div>";
      this.setStatus("Could not generate a plan.");
    }
  },

  renderList() {
    const { listEl } = this.elements;
    if (!listEl) return;

    listEl.innerHTML = "";

    if (this.state.items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "todo-empty";
      empty.textContent = "No todos yet.";
      listEl.appendChild(empty);
      return;
    }

    this.state.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = `todo-item ${item.completed ? "is-complete" : ""}`;
      row.dataset.id = item.id;

      const main = document.createElement("div");
      main.className = "todo-main";

      if (this.state.editingId === item.id) {
        const editInput = document.createElement("input");
        editInput.type = "text";
        editInput.className = "todo-edit-input";
        editInput.value = item.text;

        const editTime = document.createElement("input");
        editTime.type = "time";
        editTime.className = "todo-edit-time";
        editTime.value = item.dueTime;

        main.appendChild(editInput);
        main.appendChild(editTime);
      } else {
        const text = document.createElement("div");
        text.className = "todo-text";
        text.textContent = item.text;

        const time = document.createElement("div");
        time.className = "todo-time-label";
        time.textContent = `Due ${item.dueTime}`;

        main.appendChild(text);
        main.appendChild(time);
      }

      const actions = document.createElement("div");
      actions.className = "todo-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "todo-action-btn is-primary";
      editBtn.textContent = this.state.editingId === item.id ? "Save" : "Edit";
      editBtn.dataset.action = this.state.editingId === item.id ? "save" : "edit";

      const completeBtn = document.createElement("button");
      completeBtn.className = "todo-action-btn";
      completeBtn.textContent = item.completed ? "Undo" : "Done";
      completeBtn.dataset.action = "toggle";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "todo-action-btn is-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.dataset.action = "delete";

      actions.appendChild(editBtn);
      actions.appendChild(completeBtn);
      actions.appendChild(deleteBtn);

      row.appendChild(main);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
  },

  render() {
    const { answerEl, plannerContent } = this.elements;
    this.setStatus("Add a todo and a due time.");
    if (answerEl) {
      answerEl.innerHTML = "";
    }
    if (plannerContent && !plannerContent.textContent.trim()) {
      plannerContent.innerHTML = "<div class=\"planner-empty\">Your plan will appear here</div>";
    }
    this.renderList();
    this.updateGreetingState();
  }
};





