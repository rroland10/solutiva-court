/**
 * Animation Utility Functions
 * Handles all animation-related functionality
 */

import { getConfig } from '../config/app.config.js';
import { createElement, getElement, setStyles } from './dom.utils.js';

/**
 * Animation manager class
 */
class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.performanceMode = getConfig('ANIMATIONS.PERFORMANCE_MODE');
    }

    /**
     * Check if animations are enabled
     * @returns {boolean}
     */
    isEnabled() {
        return getConfig('ANIMATIONS.ENABLED') && !this.isReducedMotion;
    }

    /**
     * Animate element with CSS transitions
     * @param {HTMLElement} element - Target element
     * @param {Object} properties - CSS properties to animate
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async animate(element, properties, options = {}) {
        if (!this.isEnabled() || !element) {
            return Promise.resolve();
        }

        const defaultOptions = {
            duration: getConfig('UI.ANIMATION_DURATION'),
            easing: 'ease-out',
            delay: 0
        };

        const config = { ...defaultOptions, ...options };

        return new Promise((resolve) => {
            const startTime = performance.now();
            
            // Store original styles
            const originalStyles = {};
            Object.keys(properties).forEach(prop => {
                originalStyles[prop] = getComputedStyle(element, prop);
            });

            // Set initial state
            setStyles(element, {
                transition: `all ${config.duration}ms ${config.easing}`,
                transitionDelay: `${config.delay}ms`
            });

            // Apply target properties
            requestAnimationFrame(() => {
                setStyles(element, properties);
            });

            // Handle completion
            const handleTransitionEnd = () => {
                element.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            };

            element.addEventListener('transitionend', handleTransitionEnd);

            // Fallback timeout
            setTimeout(() => {
                element.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            }, config.duration + config.delay + 100);
        });
    }

    /**
     * Fade in element
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async fadeIn(element, options = {}) {
        setStyles(element, { opacity: '0' });
        element.style.display = '';
        
        return this.animate(element, { opacity: '1' }, options);
    }

    /**
     * Fade out element
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async fadeOut(element, options = {}) {
        await this.animate(element, { opacity: '0' }, options);
        element.style.display = 'none';
    }

    /**
     * Slide in element from direction
     * @param {HTMLElement} element - Target element
     * @param {string} direction - Slide direction (up, down, left, right)
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async slideIn(element, direction = 'up', options = {}) {
        const transforms = {
            up: 'translateY(30px)',
            down: 'translateY(-30px)',
            left: 'translateX(30px)',
            right: 'translateX(-30px)'
        };

        setStyles(element, {
            opacity: '0',
            transform: transforms[direction] || transforms.up
        });
        element.style.display = '';

        return this.animate(element, {
            opacity: '1',
            transform: 'translate(0, 0)'
        }, options);
    }

    /**
     * Slide out element to direction
     * @param {HTMLElement} element - Target element
     * @param {string} direction - Slide direction (up, down, left, right)
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async slideOut(element, direction = 'up', options = {}) {
        const transforms = {
            up: 'translateY(-30px)',
            down: 'translateY(30px)',
            left: 'translateX(-30px)',
            right: 'translateX(30px)'
        };

        await this.animate(element, {
            opacity: '0',
            transform: transforms[direction] || transforms.up
        }, options);
        element.style.display = 'none';
    }

    /**
     * Scale element
     * @param {HTMLElement} element - Target element
     * @param {number} scale - Scale factor
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async scale(element, scale, options = {}) {
        return this.animate(element, {
            transform: `scale(${scale})`
        }, options);
    }

    /**
     * Rotate element
     * @param {HTMLElement} element - Target element
     * @param {number} degrees - Rotation degrees
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async rotate(element, degrees, options = {}) {
        return this.animate(element, {
            transform: `rotate(${degrees}deg)`
        }, options);
    }

    /**
     * Create floating particles effect
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Particle options
     */
    createParticles(element, options = {}) {
        if (!this.isEnabled() || this.performanceMode) return;

        const defaultOptions = {
            count: 5,
            colors: ['#6366f1', '#f59e0b', '#10b981', '#ef4444'],
            duration: 1000,
            distance: 50
        };

        const config = { ...defaultOptions, ...options };
        const rect = element.getBoundingClientRect();

        for (let i = 0; i < config.count; i++) {
            const particle = createElement('div', {
                style: {
                    position: 'absolute',
                    width: '4px',
                    height: '4px',
                    background: config.colors[Math.floor(Math.random() * config.colors.length)],
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: '1000',
                    left: `${rect.left + Math.random() * rect.width}px`,
                    top: `${rect.top + Math.random() * rect.height}px`
                }
            });

            document.body.appendChild(particle);

            const animation = particle.animate([
                {
                    transform: 'translateY(0) scale(1)',
                    opacity: 1
                },
                {
                    transform: `translateY(-${config.distance + Math.random() * config.distance}px) scale(0)`,
                    opacity: 0
                }
            ], {
                duration: config.duration + Math.random() * config.distance,
                easing: 'ease-out'
            });

            animation.onfinish = () => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            };
        }
    }

    /**
     * Create ripple effect
     * @param {HTMLElement} element - Target element
     * @param {Event} event - Mouse event
     */
    createRipple(element, event) {
        if (!this.isEnabled()) return;

        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const ripple = createElement('span', {
            style: {
                position: 'absolute',
                width: `${size}px`,
                height: `${size}px`,
                left: `${x}px`,
                top: `${y}px`,
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                transform: 'scale(0)',
                animation: 'ripple 0.6s linear',
                pointerEvents: 'none'
            }
        });

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    /**
     * Animate counter
     * @param {HTMLElement} element - Target element
     * @param {number} targetValue - Target value
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async animateCounter(element, targetValue, options = {}) {
        if (!this.isEnabled()) {
            element.textContent = targetValue;
            return Promise.resolve();
        }

        const defaultOptions = {
            duration: 1000,
            step: 1,
            format: (value) => value
        };

        const config = { ...defaultOptions, ...options };
        const startValue = parseFloat(element.textContent) || 0;
        const increment = (targetValue - startValue) / (config.duration / 16);

        return new Promise((resolve) => {
            let currentValue = startValue;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / config.duration, 1);

                currentValue = startValue + (targetValue - startValue) * progress;
                element.textContent = config.format(Math.round(currentValue));

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = config.format(targetValue);
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Animate progress bar
     * @param {HTMLElement} element - Target element
     * @param {number} targetValue - Target percentage (0-100)
     * @param {Object} options - Animation options
     * @returns {Promise}
     */
    async animateProgress(element, targetValue, options = {}) {
        if (!this.isEnabled()) {
            element.style.width = `${targetValue}%`;
            return Promise.resolve();
        }

        const defaultOptions = {
            duration: 1000,
            easing: 'ease-out'
        };

        const config = { ...defaultOptions, ...options };
        const startValue = parseFloat(element.style.width) || 0;

        return this.animate(element, {
            width: `${targetValue}%`
        }, config);
    }

    /**
     * Stagger animations for multiple elements
     * @param {HTMLElement[]} elements - Array of elements
     * @param {Function} animationFn - Animation function
     * @param {Object} options - Stagger options
     * @returns {Promise}
     */
    async stagger(elements, animationFn, options = {}) {
        const defaultOptions = {
            delay: 100,
            staggerDelay: 50
        };

        const config = { ...defaultOptions, ...options };
        const promises = [];

        elements.forEach((element, index) => {
            const delay = config.delay + (index * config.staggerDelay);
            const promise = new Promise((resolve) => {
                setTimeout(async () => {
                    await animationFn(element);
                    resolve();
                }, delay);
            });
            promises.push(promise);
        });

        return Promise.all(promises);
    }
}

// Create singleton instance
export const animationManager = new AnimationManager();

// Export individual functions for convenience
export const animate = (element, properties, options) => animationManager.animate(element, properties, options);
export const fadeIn = (element, options) => animationManager.fadeIn(element, options);
export const fadeOut = (element, options) => animationManager.fadeOut(element, options);
export const slideIn = (element, direction, options) => animationManager.slideIn(element, direction, options);
export const slideOut = (element, direction, options) => animationManager.slideOut(element, direction, options);
export const scale = (element, scale, options) => animationManager.scale(element, scale, options);
export const rotate = (element, degrees, options) => animationManager.rotate(element, degrees, options);
export const createParticles = (element, options) => animationManager.createParticles(element, options);
export const createRipple = (element, event) => animationManager.createRipple(element, event);
export const animateCounter = (element, targetValue, options) => animationManager.animateCounter(element, targetValue, options);
export const animateProgress = (element, targetValue, options) => animationManager.animateProgress(element, targetValue, options);
export const stagger = (elements, animationFn, options) => animationManager.stagger(elements, animationFn, options);

export default animationManager; 