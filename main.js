// Main application orchestrator
const App = {
  state: {
    activeMode: "qa"
  },

  async init() {
    // Set up global namespace
    window.AppState = this.state;
    window.QaComponent = QaComponent;
    window.TodoComponent = TodoComponent;
    window.SidebarComponent = SidebarComponent;
    window.DockComponent = DockComponent;
    window.PdfComponent = PdfComponent;

    // Initialize all components
    try {
      QaComponent.init();
      TodoComponent.init();
      SidebarComponent.init();
      DockComponent.init();
      PdfComponent.init();

      // Set up global event listeners
      this.bindGlobalEvents();

      console.log("App initialized successfully");
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  },

  bindGlobalEvents() {
    // Global glow effect
    const glow = document.querySelector(".glow");
    if (glow) {
      document.addEventListener("mousemove", (event) => {
        Utils.updateGlow(event, glow);
      });
    }

    // Logout button
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        // Add logout logic here
        console.log("Logout clicked");
      });
    }
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
