/**
 * Modal Component
 * Reusable modal dialog component
 */

import { getConfig } from '../config/app.config.js';
import { createElement, getElement, addEventListener, removeEventListener } from '../utils/dom.utils.js';
import { fadeIn, fadeOut, slideIn, slideOut } from '../utils/animation.utils.js';

class Modal {
    constructor(options = {}) {
        this.options = {
            id: `modal-${Date.now()}`,
            title: '',
            content: '',
            size: 'medium', // small, medium, large, full
            closable: true,
            backdrop: true,
            animation: true,
            onOpen: null,
            onClose: null,
            onConfirm: null,
            onCancel: null,
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            showFooter: true,
            ...options
        };

        this.isOpen = false;
        this.element = null;
        this.backdrop = null;
        this.content = null;

        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        // Create backdrop
        this.backdrop = createElement('div', {
            className: 'modal-backdrop',
            style: {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '1500',
                backdropFilter: `blur(${getConfig('UI.MODAL_BACKDROP_BLUR')}px)`,
                transition: 'all 0.3s ease'
            }
        });

        // Create modal content
        const modalContent = this.createModalContent();
        
        // Create modal container
        this.element = createElement('div', {
            className: 'modal-container',
            style: {
                position: 'relative',
                maxWidth: this.getModalWidth(),
                width: '90%',
                maxHeight: '80%',
                transform: 'scale(0.8)',
                opacity: '0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }
        }, modalContent);

        this.backdrop.appendChild(this.element);
        document.body.appendChild(this.backdrop);
    }

    createModalContent() {
        const content = createElement('div', {
            className: 'modal-content',
            style: {
                background: 'white',
                borderRadius: '1rem',
                overflow: 'hidden'
            }
        });

        // Header
        if (this.options.title) {
            const header = createElement('div', {
                className: 'modal-header',
                style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb'
                }
            });

            const title = createElement('h3', {
                style: {
                    margin: '0',
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937'
                }
            }, this.options.title);

            header.appendChild(title);

            if (this.options.closable) {
                const closeBtn = createElement('button', {
                    className: 'modal-close',
                    style: {
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#6b7280',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        transition: 'all 0.2s ease'
                    }
                }, '×');

                addEventListener(closeBtn, 'click', () => this.close());
                addEventListener(closeBtn, 'mouseenter', () => {
                    closeBtn.style.color = '#ef4444';
                    closeBtn.style.transform = 'scale(1.1)';
                });
                addEventListener(closeBtn, 'mouseleave', () => {
                    closeBtn.style.color = '#6b7280';
                    closeBtn.style.transform = 'scale(1)';
                });

                header.appendChild(closeBtn);
            }

            content.appendChild(header);
        }

        // Body
        const body = createElement('div', {
            className: 'modal-body',
            style: {
                padding: '1.5rem',
                maxHeight: '60vh',
                overflowY: 'auto'
            }
        });

        if (typeof this.options.content === 'string') {
            body.innerHTML = this.options.content;
        } else if (this.options.content instanceof HTMLElement) {
            body.appendChild(this.options.content);
        }

        content.appendChild(body);

        // Footer
        if (this.options.showFooter && (this.options.onConfirm || this.options.onCancel)) {
            const footer = createElement('div', {
                className: 'modal-footer',
                style: {
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'flex-end',
                    padding: '1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    background: '#f9fafb'
                }
            });

            if (this.options.onCancel) {
                const cancelBtn = createElement('button', {
                    className: 'btn btn-outline',
                    style: {
                        padding: '0.75rem 1.5rem',
                        border: '2px solid #6366f1',
                        borderRadius: '0.5rem',
                        background: 'transparent',
                        color: '#6366f1',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.3s ease'
                    }
                }, this.options.cancelText);

                addEventListener(cancelBtn, 'click', () => this.handleCancel());
                addEventListener(cancelBtn, 'mouseenter', () => {
                    cancelBtn.style.background = '#6366f1';
                    cancelBtn.style.color = 'white';
                    cancelBtn.style.transform = 'translateY(-2px)';
                });
                addEventListener(cancelBtn, 'mouseleave', () => {
                    cancelBtn.style.background = 'transparent';
                    cancelBtn.style.color = '#6366f1';
                    cancelBtn.style.transform = 'translateY(0)';
                });

                footer.appendChild(cancelBtn);
            }

            if (this.options.onConfirm) {
                const confirmBtn = createElement('button', {
                    className: 'btn btn-primary',
                    style: {
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        background: '#6366f1',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.3s ease'
                    }
                }, this.options.confirmText);

                addEventListener(confirmBtn, 'click', () => this.handleConfirm());
                addEventListener(confirmBtn, 'mouseenter', () => {
                    confirmBtn.style.background = '#4f46e5';
                    confirmBtn.style.transform = 'translateY(-2px)';
                    confirmBtn.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.4)';
                });
                addEventListener(confirmBtn, 'mouseleave', () => {
                    confirmBtn.style.background = '#6366f1';
                    confirmBtn.style.transform = 'translateY(0)';
                    confirmBtn.style.boxShadow = 'none';
                });

                footer.appendChild(confirmBtn);
            }

            content.appendChild(footer);
        }

        return content;
    }

    getModalWidth() {
        const sizes = {
            small: '400px',
            medium: '600px',
            large: '800px',
            full: '95%'
        };
        return sizes[this.options.size] || sizes.medium;
    }

    bindEvents() {
        // Backdrop click
        if (this.options.backdrop && this.options.closable) {
            addEventListener(this.backdrop, 'click', (e) => {
                if (e.target === this.backdrop) {
                    this.close();
                }
            });
        }

        // Escape key
        addEventListener(document, 'keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen && this.options.closable) {
                this.close();
            }
        });
    }

    async open() {
        if (this.isOpen) return;

        this.isOpen = true;
        this.backdrop.style.display = 'flex';

        if (this.options.animation) {
            await fadeIn(this.backdrop, { duration: 200 });
            await slideIn(this.element, 'up', { duration: 300 });
        } else {
            this.backdrop.style.opacity = '1';
            this.element.style.transform = 'scale(1)';
            this.element.style.opacity = '1';
        }

        // Focus management
        this.element.focus();
        this.element.setAttribute('tabindex', '-1');

        if (this.options.onOpen) {
            this.options.onOpen(this);
        }
    }

    async close() {
        if (!this.isOpen) return;

        if (this.options.animation) {
            await slideOut(this.element, 'up', { duration: 200 });
            await fadeOut(this.backdrop, { duration: 200 });
        } else {
            this.element.style.transform = 'scale(0.8)';
            this.element.style.opacity = '0';
            this.backdrop.style.opacity = '0';
        }

        this.backdrop.style.display = 'none';
        this.isOpen = false;

        if (this.options.onClose) {
            this.options.onClose(this);
        }
    }

    async handleConfirm() {
        if (this.options.onConfirm) {
            await this.options.onConfirm(this);
        }
        await this.close();
    }

    async handleCancel() {
        if (this.options.onCancel) {
            await this.options.onCancel(this);
        }
        await this.close();
    }

    setContent(content) {
        const body = this.element.querySelector('.modal-body');
        if (body) {
            body.innerHTML = '';
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                body.appendChild(content);
            }
        }
    }

    setTitle(title) {
        const titleElement = this.element.querySelector('.modal-header h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    destroy() {
        if (this.backdrop && this.backdrop.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }
        this.isOpen = false;
    }
}

// Static methods for common modal types
Modal.confirm = (message, options = {}) => {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: 'Confirm',
            content: `<p>${message}</p>`,
            size: 'small',
            onConfirm: () => resolve(true),
            onCancel: () => resolve(false),
            confirmText: options.confirmText || 'Yes',
            cancelText: options.cancelText || 'No',
            ...options
        });
        modal.open();
    });
};

Modal.alert = (message, options = {}) => {
    return new Promise((resolve) => {
        const modal = new Modal({
            title: 'Alert',
            content: `<p>${message}</p>`,
            size: 'small',
            onConfirm: () => resolve(),
            showFooter: false,
            closable: true,
            ...options
        });
        modal.open();
    });
};

Modal.prompt = (message, defaultValue = '', options = {}) => {
    return new Promise((resolve) => {
        const input = createElement('input', {
            type: 'text',
            value: defaultValue,
            style: {
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                marginTop: '1rem'
            }
        });

        const modal = new Modal({
            title: 'Input Required',
            content: createElement('div', {}, [
                createElement('p', {}, message),
                input
            ]),
            size: 'small',
            onConfirm: () => resolve(input.value),
            onCancel: () => resolve(null),
            confirmText: options.confirmText || 'OK',
            cancelText: options.cancelText || 'Cancel',
            ...options
        });

        modal.open();
        
        // Focus input
        setTimeout(() => input.focus(), 100);
    });
};

export default Modal; 