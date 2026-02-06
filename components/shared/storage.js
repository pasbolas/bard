// Storage management for the application
const Storage = {
  QA_KEY: "studyqa:savedResponses",
  QA_CONVERSATIONS_KEY: "studyqa:qaConversations",
  TODO_KEY: "studyqa:todoHistory",
  TODO_ITEMS_KEY: "studyqa:todoItems",

  loadQaResponses() {
    try {
      const raw = localStorage.getItem(this.QA_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading QA responses:", error);
      return [];
    }
  },

  saveQaResponses(responses) {
    try {
      localStorage.setItem(this.QA_KEY, JSON.stringify(responses, null, 2));
    } catch (error) {
      console.error("Error saving QA responses:", error);
    }
  },

  loadQaConversations() {
    try {
      const raw = localStorage.getItem(this.QA_CONVERSATIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }

      const legacyRaw = localStorage.getItem(this.QA_KEY);
      if (!legacyRaw) return [];
      const legacy = JSON.parse(legacyRaw);
      if (!Array.isArray(legacy)) return [];

      const migrated = legacy.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        title: item.question || "New chat",
        messages: [
          { role: "user", content: item.question || "", timestamp: item.timestamp },
          { role: "assistant", content: item.answer || "", timestamp: item.timestamp }
        ],
        createdAt: item.timestamp || new Date().toISOString(),
        updatedAt: item.timestamp || new Date().toISOString(),
        isFavorite: !!item.isFavorite
      }));

      localStorage.setItem(this.QA_CONVERSATIONS_KEY, JSON.stringify(migrated, null, 2));
      return migrated;
    } catch (error) {
      console.error("Error loading QA conversations:", error);
      return [];
    }
  },

  saveQaConversations(conversations) {
    try {
      localStorage.setItem(this.QA_CONVERSATIONS_KEY, JSON.stringify(conversations, null, 2));
    } catch (error) {
      console.error("Error saving QA conversations:", error);
    }
  },

  loadTodoHistory() {
    try {
      const raw = localStorage.getItem(this.TODO_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading todo history:", error);
      return [];
    }
  },

  saveTodoHistory(history) {
    try {
      localStorage.setItem(this.TODO_KEY, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error("Error saving todo history:", error);
    }
  },

  loadTodoItems() {
    try {
      const raw = localStorage.getItem(this.TODO_ITEMS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading todo items:", error);
      return [];
    }
  },

  saveTodoItems(items) {
    try {
      localStorage.setItem(this.TODO_ITEMS_KEY, JSON.stringify(items, null, 2));
    } catch (error) {
      console.error("Error saving todo items:", error);
    }
  }
};
