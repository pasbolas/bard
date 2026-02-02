// Shared utility functions
const Utils = {
  // Ripple effect for buttons
  createRipple(event) {
    const button = event.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add("ripple");

    const existingRipple = button.querySelector(".ripple");
    if (existingRipple) {
      existingRipple.remove();
    }

    button.appendChild(ripple);
  },

  // Update glow effect based on mouse position
  updateGlow(event, glowElement) {
    if (!glowElement) return;
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    glowElement.style.setProperty("--mx", `${x}%`);
    glowElement.style.setProperty("--my", `${y}%`);
  },

  // Type text with markdown rendering
  async typeMarkdown(text, targetElement, markedParser) {
    if (!targetElement) return;
    
    targetElement.classList.remove("fade-in");
    targetElement.innerHTML = "";

    let buffer = "";
    for (let i = 0; i < text.length; i += 1) {
      buffer += text[i];
      if (i % 3 === 0) {
        targetElement.innerHTML = markedParser.parse(buffer);
        await new Promise((resolve) => setTimeout(resolve, 6));
      }
    }

    targetElement.innerHTML = markedParser.parse(buffer);
    targetElement.classList.add("fade-in");
  },

  // Generate unique ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Format date for display
  formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  },

  // Truncate text with ellipsis
  truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  }
};
