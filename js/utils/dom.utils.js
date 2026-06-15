/**
 * DOM Utility Functions
 * Common DOM manipulation and helper functions
 */

import { getConfig } from '../config/app.config.js';

/**
 * Create a DOM element with attributes and content
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string|HTMLElement} content - Element content
 * @returns {HTMLElement}
 */
export const createElement = (tag, attributes = {}, content = '') => {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Set content
    if (typeof content === 'string') {
        element.textContent = content;
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    }
    
    return element;
};

/**
 * Get element by selector with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null}
 */
export const getElement = (selector, parent = document) => {
    try {
        return parent.querySelector(selector);
    } catch (error) {
        console.error(`Error finding element with selector: ${selector}`, error);
        return null;
    }
};

/**
 * Get multiple elements by selector
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {NodeList}
 */
export const getElements = (selector, parent = document) => {
    try {
        return parent.querySelectorAll(selector);
    } catch (error) {
        console.error(`Error finding elements with selector: ${selector}`, error);
        return [];
    }
};

/**
 * Add event listener with error handling
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 */
export const addEventListener = (element, event, handler, options = {}) => {
    try {
        element.addEventListener(event, handler, options);
    } catch (error) {
        console.error(`Error adding event listener for ${event}:`, error);
    }
};

/**
 * Remove event listener
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 */
export const removeEventListener = (element, event, handler, options = {}) => {
    try {
        element.removeEventListener(event, handler, options);
    } catch (error) {
        console.error(`Error removing event listener for ${event}:`, error);
    }
};

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Target element
 * @param {boolean} show - Whether to show or hide
 */
export const toggleVisibility = (element, show) => {
    if (!element) return;
    
    if (show) {
        element.style.display = '';
        element.classList.remove('hidden');
    } else {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
};

/**
 * Add/remove CSS classes
 * @param {HTMLElement} element - Target element
 * @param {string|Array} classes - CSS classes
 * @param {boolean} add - Whether to add or remove classes
 */
export const toggleClasses = (element, classes, add = true) => {
    if (!element) return;
    
    const classList = Array.isArray(classes) ? classes : [classes];
    
    classList.forEach(className => {
        if (add) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    });
};

/**
 * Set element styles
 * @param {HTMLElement} element - Target element
 * @param {Object} styles - CSS styles object
 */
export const setStyles = (element, styles) => {
    if (!element) return;
    
    Object.assign(element.style, styles);
};

/**
 * Get computed styles
 * @param {HTMLElement} element - Target element
 * @param {string} property - CSS property name
 * @returns {string}
 */
export const getComputedStyle = (element, property) => {
    if (!element) return '';
    
    try {
        return window.getComputedStyle(element).getPropertyValue(property);
    } catch (error) {
        console.error(`Error getting computed style for ${property}:`, error);
        return '';
    }
};

/**
 * Scroll element into view
 * @param {HTMLElement} element - Target element
 * @param {Object} options - Scroll options
 */
export const scrollIntoView = (element, options = {}) => {
    if (!element) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Target element
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean}
 */
export const isInViewport = (element, threshold = 0.1) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
    
    const visibleArea = visibleHeight * visibleWidth;
    const totalArea = rect.height * rect.width;
    
    return visibleArea / totalArea >= threshold;
};

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
export const debounce = (func, delay) => {
    let timeoutId;
    
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function}
 */
export const throttle = (func, limit) => {
    let inThrottle;
    
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Create a loading spinner
 * @param {string} size - Spinner size (small, medium, large)
 * @returns {HTMLElement}
 */
export const createSpinner = (size = 'medium') => {
    const sizes = {
        small: '16px',
        medium: '24px',
        large: '32px'
    };
    
    const spinner = createElement('div', {
        className: 'loading-spinner',
        style: {
            width: sizes[size] || sizes.medium,
            height: sizes[size] || sizes.medium,
            border: `2px solid rgba(255, 255, 255, 0.3)`,
            borderTop: `2px solid #fff`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }
    });
    
    return spinner;
};

/**
 * Show/hide loading state
 * @param {HTMLElement} element - Target element
 * @param {boolean} loading - Whether to show loading state
 * @param {string} text - Loading text
 */
export const setLoadingState = (element, loading, text = 'Loading...') => {
    if (!element) return;
    
    if (loading) {
        element.disabled = true;
        element.dataset.originalText = element.textContent;
        element.innerHTML = `${createSpinner('small').outerHTML} ${text}`;
    } else {
        element.disabled = false;
        element.textContent = element.dataset.originalText || '';
        delete element.dataset.originalText;
    }
};

export default {
    createElement,
    getElement,
    getElements,
    addEventListener,
    removeEventListener,
    toggleVisibility,
    toggleClasses,
    setStyles,
    getComputedStyle,
    scrollIntoView,
    isInViewport,
    debounce,
    throttle,
    createSpinner,
    setLoadingState
}; 