// Gradual Blur Effect
// Creates multiple layered divs with increasing blur for smooth gradient effect

function initGradualBlur() {
  const answerBox = document.getElementById('answerBox');
  if (!answerBox) return;

  const blurContainer = answerBox.querySelector('.gradual-blur');
  if (!blurContainer) return;

  const divCount = 5;
  const height = '7rem';
  const strength = 2;

  // Clear existing blur divs
  blurContainer.innerHTML = '';

  // Create layered blur divs
  for (let i = 0; i < divCount; i++) {
    const div = document.createElement('div');
    const progress = i / (divCount - 1);
    
    // Exponential curve for more natural blur progression
    const exponentialProgress = Math.pow(progress, 2);
    
    // Calculate blur amount
    const blurAmount = exponentialProgress * strength * 8;
    
    // Calculate opacity (stronger at bottom)
    const opacity = 1 - (progress * 0.3);
    
    Object.assign(div.style, {
      position: 'absolute',
      bottom: '0',
      left: '0',
      right: '0',
      height: height,
      pointerEvents: 'none',
      backdropFilter: `blur(${blurAmount}px)`,
      WebkitBackdropFilter: `blur(${blurAmount}px)`,
      background: `linear-gradient(to top, rgba(15, 20, 27, ${opacity}) 0%, transparent 100%)`,
      zIndex: 10 + i
    });
    
    blurContainer.appendChild(div);
  }

  console.log('Gradual blur initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGradualBlur);
} else {
  initGradualBlur();
}
