// Shiny Text Animation
function applyShinyText(element, options = {}) {
  const {
    speed = 2,
    color = '#b5b5b5',
    shineColor = '#ffffff',
    spread = 120,
    yoyo = false,
    pauseOnHover = false,
    direction = 'left',
    delay = 0
  } = options;

  if (!element) return;

  // Apply gradient style
  const gradientStyle = `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`;
  
  element.style.backgroundImage = gradientStyle;
  element.style.backgroundSize = '200% auto';
  element.style.webkitBackgroundClip = 'text';
  element.style.backgroundClip = 'text';
  element.style.webkitTextFillColor = 'transparent';
  element.style.color = 'transparent';

  // Calculate animation duration
  const animationDuration = speed;
  const totalDuration = animationDuration + delay;

  // Create keyframes
  const animationName = `shiny-text-${Math.random().toString(36).substr(2, 9)}`;
  
  let keyframes;
  if (yoyo) {
    if (direction === 'left') {
      keyframes = `
        @keyframes ${animationName} {
          0% { background-position: 150% center; }
          ${(animationDuration / (totalDuration * 2)) * 100}% { background-position: -50% center; }
          ${((animationDuration + delay) / (totalDuration * 2)) * 100}% { background-position: -50% center; }
          ${((animationDuration + delay + animationDuration) / (totalDuration * 2)) * 100}% { background-position: 150% center; }
          100% { background-position: 150% center; }
        }
      `;
    } else {
      keyframes = `
        @keyframes ${animationName} {
          0% { background-position: -50% center; }
          ${(animationDuration / (totalDuration * 2)) * 100}% { background-position: 150% center; }
          ${((animationDuration + delay) / (totalDuration * 2)) * 100}% { background-position: 150% center; }
          ${((animationDuration + delay + animationDuration) / (totalDuration * 2)) * 100}% { background-position: -50% center; }
          100% { background-position: -50% center; }
        }
      `;
    }
  } else {
    if (direction === 'left') {
      keyframes = `
        @keyframes ${animationName} {
          0% { background-position: 150% center; }
          ${(animationDuration / totalDuration) * 100}% { background-position: -50% center; }
          100% { background-position: -50% center; }
        }
      `;
    } else {
      keyframes = `
        @keyframes ${animationName} {
          0% { background-position: -50% center; }
          ${(animationDuration / totalDuration) * 100}% { background-position: 150% center; }
          100% { background-position: 150% center; }
        }
      `;
    }
  }

  // Inject keyframes
  const styleSheet = document.createElement('style');
  styleSheet.textContent = keyframes;
  document.head.appendChild(styleSheet);

  // Apply animation
  element.style.animation = `${animationName} ${totalDuration * (yoyo ? 2 : 1)}s ease-in-out infinite`;

  // Pause on hover
  if (pauseOnHover) {
    element.addEventListener('mouseenter', () => {
      element.style.animationPlayState = 'paused';
    });
    element.addEventListener('mouseleave', () => {
      element.style.animationPlayState = 'running';
    });
  }

  return () => {
    element.style.animation = '';
    element.style.backgroundImage = '';
    element.style.webkitBackgroundClip = '';
    element.style.backgroundClip = '';
    element.style.webkitTextFillColor = '';
    element.style.color = '';
    document.head.removeChild(styleSheet);
  };
}

// Apply to all saved questions
function applyShinyToSavedQuestions() {
  const savedQuestions = document.querySelectorAll('.saved-question');
  savedQuestions.forEach(element => {
    // Check if already applied
    if (element.dataset.shinyApplied) return;
    
    applyShinyText(element, {
      speed: 3,
      color: '#e5e7eb',
      shineColor: '#ffffff',
      spread: 120,
      yoyo: false,
      pauseOnHover: false,
      direction: 'left',
      delay: 1.5
    });
    
    element.dataset.shinyApplied = 'true';
  });
}

// Auto-apply to title and saved questions
document.addEventListener('DOMContentLoaded', () => {
  const titleElement = document.querySelector('.title h1');
  if (titleElement) {
    applyShinyText(titleElement, {
      speed: 3,
      color: '#e5e7eb',
      shineColor: '#ffffff',
      spread: 120,
      yoyo: false,
      pauseOnHover: false,
      direction: 'left',
      delay: 1
    });
  }
  
  // Apply to saved questions
  applyShinyToSavedQuestions();
});

// Observe for new saved questions being added
const observer = new MutationObserver(() => {
  applyShinyToSavedQuestions();
});

// Start observing when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const savedList = document.getElementById('savedList');
  if (savedList) {
    observer.observe(savedList, { childList: true, subtree: true });
  }
});
