const input = document.getElementById("questionInput");
const answerEl = document.getElementById("answer");
const answerBox = document.getElementById("answerBox");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const historyEl = document.getElementById("history");
const savedListEl = document.getElementById("savedList");
const newQueryBtn = document.getElementById("newQueryBtn");
const glow = document.querySelector(".glow");
const sidebar = document.getElementById("sidebar");
const resizer = document.getElementById("resizer");
const mainContent = document.getElementById("mainContent");

const recentQuestions = [];
const STORAGE_KEY = "studyqa:savedResponses";
let savedResponses = loadSavedResponses();
let hasAsked = false;

// Resizable sidebar functionality
let isResizing = false;

resizer.addEventListener("mousedown", (e) => {
  isResizing = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
});

document.addEventListener("mousemove", (e) => {
  if (!isResizing) return;
  
  const newWidth = e.clientX;
  if (newWidth >= 200 && newWidth <= 600) {
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

function setStatus(text, isLoading = false) {
  statusEl.innerHTML = isLoading
    ? `<span class="dot" aria-hidden="true"></span><span>${text}</span>`
    : `<span></span><span>${text}</span>`;
}

function updateGreetingState() {
  if (!mainContent) return;
  const hasAnswer = answerEl.textContent.trim().length > 0;
  if (!hasAsked && !hasAnswer) {
    mainContent.classList.add("is-empty");
  } else {
    mainContent.classList.remove("is-empty");
  }
}

function loadSavedResponses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistSavedResponses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedResponses, null, 2));
}

function renderSavedResponses() {
  savedListEl.innerHTML = "";
  if (savedResponses.length === 0) {
    const empty = document.createElement("div");
    empty.className = "saved-item";
    empty.textContent = "No saved responses yet.";
    savedListEl.appendChild(empty);
    return;
  }

  savedResponses.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "saved-item";
    const question = document.createElement("div");
    question.className = "saved-question";
    question.textContent = item.question || "Untitled question";

    const meta = document.createElement("div");
    meta.className = "saved-meta";
    meta.textContent = new Date(item.timestamp).toLocaleString();

    card.appendChild(question);
    card.appendChild(meta);
    card.addEventListener("click", () => {
      input.value = item.question || "";
      answerEl.innerHTML = marked.parse(item.answer || "");
      answerEl.classList.add("fade-in");
      setStatus("Loaded from saved responses.");
      submitBtn.style.display = "none";
      hasAsked = true;
      updateGreetingState();
    });

    savedListEl.appendChild(card);
  });
}

function createRipple(event) {
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  const rect = submitBtn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
  submitBtn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

function addHistory(question) {
  if (!question) return;
  if (!historyEl) return;
  if (recentQuestions.includes(question)) return;
  recentQuestions.unshift(question);
  if (recentQuestions.length > 5) recentQuestions.pop();

  historyEl.innerHTML = "";
  recentQuestions.forEach((q) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = q;
    chip.addEventListener("click", () => {
      input.value = q;
      input.focus();
    });
    historyEl.appendChild(chip);
  });
}

function updateGlow(event) {
  const x = (event.clientX / window.innerWidth) * 100;
  const y = (event.clientY / window.innerHeight) * 100;
  glow.style.setProperty("--mx", `${x}%`);
  glow.style.setProperty("--my", `${y}%`);
}

async function typeAnswerMarkdown(text) {
  answerEl.classList.remove("fade-in");
  answerEl.innerHTML = "";

  let buffer = "";
  for (let i = 0; i < text.length; i += 1) {
    buffer += text[i];
    if (i % 3 === 0) {
      answerEl.innerHTML = marked.parse(buffer);
      await new Promise((resolve) => setTimeout(resolve, 6));
    }
  }

  answerEl.innerHTML = marked.parse(buffer);
  answerEl.classList.add("fade-in");
}

async function askQuestion() {
  const question = input.value.trim();

  if (!question) {
    input.classList.remove("shake");
    void input.offsetWidth;
    input.classList.add("shake");
    setStatus("Please type a question first.");
    return;
  }

  hasAsked = true;
  input.value = "";
  submitBtn.disabled = true;
  answerBox.classList.add("loading");
  answerEl.innerHTML = "";
  setStatus("Thinking...", true);
  updateGreetingState();

  try {
    const response = await fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await response.json();
    const text = data.answer || data.error || "No response.";
    await typeAnswerMarkdown(text);
    addHistory(question);
    savedResponses.unshift({
      question,
      answer: text,
      timestamp: new Date().toISOString()
    });
    if (savedResponses.length > 50) savedResponses.pop();
    persistSavedResponses();
    renderSavedResponses();
    setStatus("Answer ready.");
    if (diagramiseBtn) diagramiseBtn.style.display = "block";
    updateGreetingState();
  } catch (error) {
    await typeAnswerMarkdown("Something went wrong. Please try again.");
    setStatus("Connection error.");
    updateGreetingState();
  } finally {
    answerBox.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    askQuestion();
  }
});


submitBtn.addEventListener("click", (event) => {
  createRipple(event);
  askQuestion();
});

document.addEventListener("mousemove", updateGlow);

// Magnetic hover effect for submit button (moved after event listeners)
const magnetPadding = 60;
const magnetStrength = 2;
let isMagnetActive = false;

function handleMagneticEffect(e) {
  if (!submitBtn || isResizing) return;

  const rect = submitBtn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const distX = Math.abs(centerX - e.clientX);
  const distY = Math.abs(centerY - e.clientY);

  if (distX < rect.width / 2 + magnetPadding && distY < rect.height / 2 + magnetPadding) {
    isMagnetActive = true;

    const offsetX = (e.clientX - centerX) / magnetStrength;
    const offsetY = (e.clientY - centerY) / magnetStrength;

    submitBtn.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    submitBtn.style.transition = "transform 0.3s ease-out";
  } else if (isMagnetActive) {
    isMagnetActive = false;
    submitBtn.style.transform = "translate3d(0, 0, 0)";
    submitBtn.style.transition = "transform 0.5s ease-in-out";
  }
}

document.addEventListener("mousemove", handleMagneticEffect);

renderSavedResponses();

setStatus("Ready when you are.");

if (newQueryBtn) {
  newQueryBtn.addEventListener("click", () => {
    submitBtn.style.display = "";
    input.value = "";
    input.focus();
    answerEl.innerHTML = "";
    setStatus("Ready when you are.");
    if (diagramiseBtn) diagramiseBtn.style.display = "none";
    hasAsked = false;
    updateGreetingState();
  });
}
updateGreetingState();

// Diagramise button functionality
const diagramiseBtn = document.getElementById("diagramiseBtn");
if (diagramiseBtn) {
  diagramiseBtn.addEventListener("click", () => {
    const answerText = answerEl.textContent;
    if (!answerText || answerText.trim() === "") {
      alert("Please get an answer first before diagramming.");
      return;
    }
    console.log("Diagramising:", answerText);
    // TODO: Add diagramming functionality
    alert("Diagramming feature coming soon!");
  });
}

// Mobile sidebar responsiveness
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarOverlay = document.getElementById("sidebarOverlay");
let isMobile = window.innerWidth <= 768;

function updateMobileUI() {
  isMobile = window.innerWidth <= 768;
  if (sidebarToggle) {
    if (isMobile) {
      sidebarToggle.classList.add("show");
    } else {
      sidebarToggle.classList.remove("show");
      sidebar.classList.remove("open");
      if (sidebarOverlay) sidebarOverlay.classList.remove("show");
    }
  }
}

window.addEventListener("resize", updateMobileUI);

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    if (sidebarOverlay) sidebarOverlay.classList.toggle("show");
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
  });
}

// Close sidebar when clicking a saved item on mobile
const originalRenderSavedResponses = renderSavedResponses;
renderSavedResponses = function() {
  originalRenderSavedResponses.call(this);
  
  if (isMobile) {
    const savedItems = document.querySelectorAll(".saved-item");
    savedItems.forEach(item => {
      const originalClickHandler = item.onclick;
      item.addEventListener("click", () => {
        setTimeout(() => {
          sidebar.classList.remove("open");
          if (sidebarOverlay) sidebarOverlay.classList.remove("show");
        }, 100);
      });
    });
  }
};

// Initial setup
updateMobileUI();
