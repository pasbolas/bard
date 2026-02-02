// Vanilla JavaScript Dock Component
class DockItem {
  constructor(item, container, mouseXValue) {
    this.item = item;
    this.container = container;
    this.mouseXValue = mouseXValue;
    this.baseItemSize = 50;
    this.magnification = 70;
    this.distance = 200;
    this.element = null;
    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = `dock-item ${this.item.className || ''}`;
    this.element.setAttribute('role', 'button');
    this.element.setAttribute('tabindex', '0');
    
    const icon = document.createElement('div');
    icon.className = 'dock-icon';
    icon.innerHTML = this.item.icon;
    this.element.appendChild(icon);

    const label = document.createElement('div');
    label.className = 'dock-label';
    label.textContent = this.item.label;
    this.element.appendChild(label);

    this.element.addEventListener('click', this.item.onClick);
    this.element.addEventListener('mouseenter', () => this.onHover(true));
    this.element.addEventListener('mouseleave', () => this.onHover(false));

    this.container.appendChild(this.element);
  }

  onHover(isHovered) {
    if (isHovered) {
      this.element.classList.add('hovered');
    } else {
      this.element.classList.remove('hovered');
    }
  }

  updateSize(mouseX) {
    if (!this.element) return;

    const rect = this.element.getBoundingClientRect();
    const itemCenterX = rect.left + rect.width / 2;
    const distance = Math.abs(mouseX - itemCenterX);

    let size = this.baseItemSize;
    if (distance < this.distance) {
      const scale = 1 + (this.magnification - this.baseItemSize) / this.baseItemSize * (1 - distance / this.distance);
      size = this.baseItemSize * scale;
    }

    this.element.style.width = `${size}px`;
    this.element.style.height = `${size}px`;
  }
}

class Dock {
  constructor(items, options = {}) {
    this.items = items;
    this.options = {
      magnification: 70,
      distance: 200,
      baseItemSize: 50,
      ...options
    };
    this.dockItems = [];
    this.mouseX = Infinity;
    this.isHovered = false;
    this.init();
  }

  init() {
    // Create outer container
    this.outer = document.createElement('div');
    this.outer.className = 'dock-outer';

    // Create panel
    this.panel = document.createElement('div');
    this.panel.className = `dock-panel ${this.options.className || ''}`;
    this.panel.setAttribute('role', 'toolbar');
    this.panel.setAttribute('aria-label', 'Application dock');

    // Create dock items
    this.items.forEach(item => {
      const dockItem = new DockItem(item, this.panel, this.mouseX);
      dockItem.magnification = this.options.magnification;
      dockItem.distance = this.options.distance;
      dockItem.baseItemSize = this.options.baseItemSize;
      this.dockItems.push(dockItem);
    });

    this.outer.appendChild(this.panel);

    // Add event listeners
    this.panel.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.panel.addEventListener('mouseleave', () => this.onMouseLeave());
  }

  onMouseMove(e) {
    this.isHovered = true;
    this.mouseX = e.pageX;
    this.updateItemSizes();
  }

  onMouseLeave() {
    this.isHovered = false;
    this.mouseX = Infinity;
    this.updateItemSizes();
  }

  updateItemSizes() {
    this.dockItems.forEach(item => {
      item.updateSize(this.mouseX);
    });
  }

  mount(selector) {
    const container = document.querySelector(selector);
    if (container) {
      container.appendChild(this.outer);
    }
  }

  appendTo(element) {
    if (typeof element === 'string') {
      this.mount(element);
    } else {
      element.appendChild(this.outer);
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dock;
}
