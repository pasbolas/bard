// API communication layer
const API = {
  BASE_URL: "http://localhost:3000",

  async askQuestion(question, messages = []) {
    try {
      const response = await fetch(`${this.BASE_URL}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question, messages })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API error (askQuestion):", error);
      throw error;
    }
  },

  async diagramise(text) {
    try {
      const response = await fetch(`${this.BASE_URL}/diagramise`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API error (diagramise):", error);
      throw error;
    }
  },

  async planDay(todos, currentTime) {
    try {
      const response = await fetch(`${this.BASE_URL}/plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ todos, currentTime })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API error (planDay):", error);
      throw error;
    }
  }
};
