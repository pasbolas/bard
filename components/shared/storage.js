// Storage management for the application
const Storage = {
  QA_KEY: "studyqa:savedResponses",
  TODO_KEY: "studyqa:todoHistory",

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
  }
};
