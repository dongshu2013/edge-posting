import { BadgeOptions } from './types';

/**
 * Add a badge to indicate the extension is active
 */
export function addExtensionBadge(
  emoji: string = '🐝', 
  options: BadgeOptions = {}
): HTMLElement {
  const {
    position = 'bottom-right',
    size = 30,
    zIndex = 9999
  } = options;
  
  const badge = document.createElement('div');
  badge.id = 'buzz-helper-badge';
  badge.textContent = emoji;
  
  // Position based on option
  let positionCSS = '';
  if (position === 'top-right') {
    positionCSS = 'top: 20px; right: 20px;';
  } else if (position === 'top-left') {
    positionCSS = 'top: 20px; left: 20px;';
  } else if (position === 'bottom-left') {
    positionCSS = 'bottom: 20px; left: 20px;';
  } else {
    positionCSS = 'bottom: 20px; right: 20px;';
  }
  
  badge.style.cssText = `
    position: fixed;
    ${positionCSS}
    background: linear-gradient(to right, #4f46e5, #7c3aed);
    color: white;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${size * 0.5}px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: ${zIndex};
    cursor: pointer;
    transition: all 0.3s ease;
  `;
  
  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'scale(1.1)';
  });
  
  badge.addEventListener('mouseleave', () => {
    badge.style.transform = 'scale(1)';
  });
  
  badge.addEventListener('click', () => {
    badge.textContent = badge.textContent === emoji ? '✅' : emoji;
    setTimeout(() => {
      badge.textContent = emoji;
    }, 2000);
  });
  
  document.body.appendChild(badge);
  return badge;
}

/**
 * Update the badge status with different states
 */
export function updateBadgeStatus(
  badge: HTMLElement, 
  status: 'capturing' | 'captured' | 'error' | 'replying' | 'publishing' | 'passive' | 'success' | 'default'
): void {
  if (!badge) return;
  
  switch (status) {
    case 'capturing':
      badge.textContent = '👀';
      badge.style.background = '#f59e0b';
      break;
    case 'captured':
      badge.textContent = '✅';
      badge.style.background = '#10b981';
      setTimeout(() => {
        badge.textContent = '🐝';
        badge.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
      }, 3000);
      break;
    case 'error':
      badge.textContent = '❌';
      badge.style.background = '#ef4444';
      setTimeout(() => {
        badge.textContent = '🐝';
        badge.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
      }, 3000);
      break;
    case 'replying':
      badge.textContent = '✍️';
      badge.style.background = '#3b82f6';
      break;
    case 'publishing':
      badge.textContent = '🚀';
      badge.style.background = '#8b5cf6';
      break;
    case 'passive':
      badge.textContent = '🤔';
      badge.style.background = '#6b7280';
      break;
    case 'success':
      badge.textContent = '✅';
      badge.style.background = '#10b981';
      break;
    default:
      badge.textContent = '🐝';
      badge.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
  }
}

/**
 * Create a styled button
 */
export function createStyledButton(
  text: string, 
  onClick: () => void, 
  className: string = ''
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = `buzz-helper-button ${className}`;
  
  button.style.cssText = `
    background: linear-gradient(to right, rgb(99, 102, 241), rgb(126, 34, 206));
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
    height: 40px;
    line-height: 1;
    box-sizing: border-box;
    white-space: nowrap;
  `;
  
  // Add hover effect
  button.addEventListener('mouseenter', () => {
    button.style.background = 'linear-gradient(to right, rgb(79, 70, 229), rgb(124, 58, 237))';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.background = 'linear-gradient(to right, rgb(99, 102, 241), rgb(126, 34, 206))';
  });
  
  // Add click handler
  button.addEventListener('click', onClick);
  
  return button;
} 