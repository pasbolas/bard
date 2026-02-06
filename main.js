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
    this.initThemeToggle();

  },

  initThemeToggle() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

    const applyTheme = (theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      toggle.textContent = theme === "light" ? "Dark" : "Light";
      localStorage.setItem("studyqa:theme", theme);
    };

    const saved = localStorage.getItem("studyqa:theme") || "dark";
    applyTheme(saved);

    toggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      applyTheme(current === "light" ? "dark" : "light");
    });
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
