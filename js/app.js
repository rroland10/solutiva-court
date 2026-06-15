/**
 * Solutiva Court - Main Application
 * Refactored with modular architecture
 */

import { APP_CONFIG, getConfig, validateConfig } from './config/app.config.js';
import { 
    createElement, 
    getElement, 
    getElements, 
    addEventListener, 
    setLoadingState,
    debounce,
    throttle 
} from './utils/dom.utils.js';
import { 
    fadeIn, 
    fadeOut, 
    slideIn, 
    slideOut, 
    stagger, 
    animateCounter,
    createParticles,
    createRipple 
} from './utils/animation.utils.js';
import Modal from './components/Modal.js';

/**
 * Main Application Class
 */
class SolutivaCourtApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.userState = {
            address: '0x1234...5678',
            trustScore: 87,
            drtBalance: 2847.5,
            isJuryMember: false,
            notifications: 5
        };
        
        this.modals = new Map();
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Validate configuration
            if (!validateConfig()) {
                throw new Error('Invalid configuration');
            }

            // Initialize components
            this.initializeComponents();
            
            // Bind events
            this.bindEvents();
            
            // Initialize page animations
            this.initializePageAnimations();
            
            // Start real-time updates
            this.startRealTimeUpdates();
            
            console.log(`${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION} initialized successfully`);
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Application initialization failed');
        }
    }

    /**
     * Initialize UI components
     */
    initializeComponents() {
        // Initialize modals
        this.initializeModals();
        
        // Initialize cards
        this.initializeCards();
        
        // Initialize buttons
        this.initializeButtons();
        
        // Initialize forms
        this.initializeForms();
    }

    /**
     * Initialize modal components
     */
    initializeModals() {
        const modalConfigs = [
            {
                id: 'newDispute',
                title: 'Create New Dispute',
                content: this.createDisputeForm(),
                size: 'large'
            },
            {
                id: 'profile',
                title: 'Profile Settings',
                content: this.createProfileForm(),
                size: 'medium'
            }
        ];

        modalConfigs.forEach(config => {
            const modal = new Modal(config);
            this.modals.set(config.id, modal);
        });
    }

    /**
     * Create dispute form content
     */
    createDisputeForm() {
        const form = createElement('form', {
            id: 'disputeForm',
            style: { display: 'flex', flexDirection: 'column', gap: '1rem' }
        });

        const categories = [
            { value: 'contract', label: 'Contract Breach' },
            { value: 'payment', label: 'Payment Dispute' },
            { value: 'service', label: 'Service Quality' },
            { value: 'intellectual', label: 'IP Violation' },
            { value: 'employment', label: 'Employment Issue' }
        ];

        // Category select
        const categorySelect = createElement('select', {
            className: 'form-select',
            required: true
        });
        
        categorySelect.appendChild(createElement('option', { value: '' }, 'Select category...'));
        categories.forEach(cat => {
            categorySelect.appendChild(createElement('option', { value: cat.value }, cat.label));
        });

        form.appendChild(createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Dispute Category'),
            categorySelect
        ]));

        // Defendant address
        form.appendChild(createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Defendant Address'),
            createElement('input', {
                type: 'text',
                className: 'form-input',
                placeholder: '0x...',
                required: true
            })
        ]));

        // Amount
        form.appendChild(createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Requested Restitution (EOS)'),
            createElement('input', {
                type: 'number',
                className: 'form-input',
                placeholder: '0.00',
                min: '0',
                step: '0.01',
                required: true
            })
        ]));

        // Description
        form.appendChild(createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Description'),
            createElement('textarea', {
                className: 'form-input form-textarea',
                placeholder: 'Describe your dispute in detail...',
                required: true
            })
        ]));

        // Collateral info
        const collateralInfo = createElement('div', {
            style: {
                background: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
            }
        }, [
            createElement('h5', { style: { marginBottom: '0.5rem' } }, 'Required Collateral'),
            createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' } }, [
                createElement('span', {}, 'Filing Fee (2%):'),
                createElement('span', {}, '2.0 EOS')
            ]),
            createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' } }, [
                createElement('span', {}, 'Security Deposit (20%):'),
                createElement('span', {}, '20.0 EOS')
            ]),
            createElement('hr', { style: { margin: '0.5rem 0' } }),
            createElement('div', { style: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' } }, [
                createElement('span', {}, 'Total:'),
                createElement('span', {}, '22.0 EOS')
            ])
        ]);

        form.appendChild(collateralInfo);

        // Form buttons
        const buttons = createElement('div', {
            style: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' }
        });

        const cancelBtn = createElement('button', {
            type: 'button',
            className: 'btn btn-outline'
        }, 'Cancel');
        addEventListener(cancelBtn, 'click', () => this.closeModal('newDispute'));

        const submitBtn = createElement('button', {
            type: 'submit',
            className: 'btn btn-primary'
        }, 'Create Dispute');

        buttons.appendChild(cancelBtn);
        buttons.appendChild(submitBtn);
        form.appendChild(buttons);

        // Form submission
        addEventListener(form, 'submit', (e) => {
            e.preventDefault();
            this.handleDisputeCreation(form);
        });

        return form;
    }

    /**
     * Create profile form content
     */
    createProfileForm() {
        const form = createElement('form', {
            id: 'profileForm',
            style: { display: 'flex', flexDirection: 'column', gap: '1rem' }
        });

        // Name
        form.appendChild(createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Full Name'),
            createElement('input', {
                type: 'text',
                className: 'form-input',
                placeholder: 'Enter your full name',
                required: true
            })
        ]));

        // Email
        form.appendChild(createElement('div', { className: 'form-group' }, [
            createElement('label', { className: 'form-label' }, 'Email'),
            createElement('input', {
                type: 'email',
                className: 'form-input',
                placeholder: 'Enter your email',
                required: true
            })
        ]));

        // Privacy settings
        const privacySection = createElement('div', { className: 'form-group' }, [
            createElement('h4', { style: { marginBottom: '1rem' } }, 'Privacy Settings'),
            createElement('label', { className: 'form-label' }, [
                createElement('input', { type: 'checkbox', checked: true, style: { marginRight: '0.5rem' } }),
                'Enable zkSNARK evidence protection'
            ]),
            createElement('label', { className: 'form-label' }, [
                createElement('input', { type: 'checkbox', checked: true, style: { marginRight: '0.5rem' } }),
                'Anonymous jury participation'
            ]),
            createElement('label', { className: 'form-label' }, [
                createElement('input', { type: 'checkbox', style: { marginRight: '0.5rem' } }),
                'Public case history'
            ])
        ]);

        form.appendChild(privacySection);

        // Form buttons
        const buttons = createElement('div', {
            style: { display: 'flex', gap: '1rem', justifyContent: 'flex-end' }
        });

        const cancelBtn = createElement('button', {
            type: 'button',
            className: 'btn btn-outline'
        }, 'Cancel');
        addEventListener(cancelBtn, 'click', () => this.closeModal('profile'));

        const submitBtn = createElement('button', {
            type: 'submit',
            className: 'btn btn-primary'
        }, 'Save Changes');

        buttons.appendChild(cancelBtn);
        buttons.appendChild(submitBtn);
        form.appendChild(buttons);

        // Form submission
        addEventListener(form, 'submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate(form);
        });

        return form;
    }

    /**
     * Initialize card animations
     */
    initializeCards() {
        const cards = getElements('.card');
        
        cards.forEach(card => {
            // Add hover effects
            addEventListener(card, 'mouseenter', () => {
                createParticles(card);
            });

            // Add entrance animations
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
        });
    }

    /**
     * Initialize button effects
     */
    initializeButtons() {
        const buttons = getElements('.btn');
        
        buttons.forEach(button => {
            addEventListener(button, 'click', (e) => {
                createRipple(button, e);
            });
        });
    }

    /**
     * Initialize form validation
     */
    initializeForms() {
        const forms = getElements('form');
        
        forms.forEach(form => {
            addEventListener(form, 'submit', (e) => {
                if (!this.validateForm(form)) {
                    e.preventDefault();
                    this.showError('Please fill in all required fields');
                }
            });
        });
    }

    /**
     * Bind application events
     */
    bindEvents() {
        // Navigation
        const navTabs = getElements('.nav-tab');
        navTabs.forEach(tab => {
            addEventListener(tab, 'click', (e) => {
                const pageId = e.target.getAttribute('data-page') || e.target.textContent.toLowerCase();
                this.showPage(pageId);
            });
        });

        // Jury pool toggle
        const juryToggle = getElement('#juryToggle');
        if (juryToggle) {
            addEventListener(juryToggle, 'click', () => this.toggleJuryPool());
        }

        // Voting options
        const votingOptions = getElements('.voting-option');
        votingOptions.forEach(option => {
            addEventListener(option, 'click', () => this.selectVote(option));
        });

        // Submit vote
        const submitVoteBtn = getElement('#submitVote');
        if (submitVoteBtn) {
            addEventListener(submitVoteBtn, 'click', () => this.submitVote());
        }

        // Window resize
        addEventListener(window, 'resize', throttle(() => {
            this.handleResize();
        }, 250));
    }

    /**
     * Show page with animations
     */
    async showPage(pageId) {
        const currentPage = getElement('.page.active');
        const targetPage = getElement(`#${pageId}`);
        
        if (!targetPage) return;

        // Update navigation
        getElements('.nav-tab').forEach(tab => tab.classList.remove('active'));
        getElement(`[data-page="${pageId}"]`)?.classList.add('active');

        // Animate page transition
        if (currentPage) {
            await fadeOut(currentPage, { duration: 200 });
            currentPage.classList.remove('active');
        }

        targetPage.classList.add('active');
        await fadeIn(targetPage, { duration: 300 });

        // Animate page content
        const cards = targetPage.querySelectorAll('.card');
        await stagger(Array.from(cards), async (card) => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, { delay: 100, staggerDelay: 50 });

        this.currentPage = pageId;
        this.initializePageAnimations();
    }

    /**
     * Initialize page-specific animations
     */
    initializePageAnimations() {
        switch (this.currentPage) {
            case 'dashboard':
                this.animateDashboardStats();
                break;
            case 'disputes':
                this.animateTimeline();
                break;
            case 'jury':
                this.initializeVotingAnimations();
                break;
        }
    }

    /**
     * Animate dashboard statistics
     */
    async animateDashboardStats() {
        const trustScoreElement = getElement('.trust-score');
        const balanceElement = getElement('.token-amount');

        if (trustScoreElement) {
            await animateCounter(trustScoreElement, this.userState.trustScore, {
                format: (value) => `Trust: ${value}%`
            });
        }

        if (balanceElement) {
            await animateCounter(balanceElement, this.userState.drtBalance, {
                format: (value) => value.toFixed(1)
            });
        }
    }

    /**
     * Animate timeline items
     */
    async animateTimeline() {
        const timelineItems = getElements('.timeline-item');
        await stagger(Array.from(timelineItems), async (item) => {
            item.style.transition = 'all 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, { delay: 200, staggerDelay: 100 });
    }

    /**
     * Initialize voting animations
     */
    initializeVotingAnimations() {
        const votingOptions = getElements('.voting-option');
        votingOptions.forEach(option => {
            addEventListener(option, 'click', () => {
                votingOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }

    /**
     * Open modal
     */
    openModal(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.open();
        }
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.close();
        }
    }

    /**
     * Handle dispute creation
     */
    async handleDisputeCreation(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true, 'Creating...');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showSuccess('Dispute created successfully!');
            this.closeModal('newDispute');
            
            // Reset form
            form.reset();
            
        } catch (error) {
            this.showError('Failed to create dispute');
        } finally {
            setLoadingState(submitBtn, false);
        }
    }

    /**
     * Handle profile update
     */
    async handleProfileUpdate(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        setLoadingState(submitBtn, true, 'Saving...');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.showSuccess('Profile updated successfully!');
            this.closeModal('profile');
            
        } catch (error) {
            this.showError('Failed to update profile');
        } finally {
            setLoadingState(submitBtn, false);
        }
    }

    /**
     * Toggle jury pool membership
     */
    async toggleJuryPool() {
        const toggleBtn = getElement('#juryToggle');
        setLoadingState(toggleBtn, true, 'Processing...');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.userState.isJuryMember = !this.userState.isJuryMember;
            
            if (this.userState.isJuryMember) {
                toggleBtn.textContent = 'Leave Jury Pool';
                toggleBtn.className = 'btn btn-danger';
                this.showSuccess('Successfully joined jury pool!');
            } else {
                toggleBtn.textContent = 'Join Jury Pool';
                toggleBtn.className = 'btn btn-success';
                this.showInfo('Left jury pool');
            }
            
        } catch (error) {
            this.showError('Failed to update jury pool status');
        } finally {
            setLoadingState(toggleBtn, false);
        }
    }

    /**
     * Select voting option
     */
    selectVote(option) {
        getElements('.voting-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
    }

    /**
     * Submit vote
     */
    async submitVote() {
        const selectedOption = getElement('.voting-option.selected');
        
        if (!selectedOption) {
            this.showWarning('Please select a voting option');
            return;
        }

        const submitBtn = getElement('#submitVote');
        setLoadingState(submitBtn, true, 'Submitting...');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showSuccess('Vote submitted successfully!');
            
            // Animate progress bar
            const progressBar = getElement('.progress-bar .progress-fill');
            if (progressBar) {
                const currentProgress = parseFloat(progressBar.style.width) || 0;
                progressBar.style.width = `${currentProgress + 20}%`;
            }
            
        } catch (error) {
            this.showError('Failed to submit vote');
        } finally {
            setLoadingState(submitBtn, false);
        }
    }

    /**
     * Validate form
     */
    validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        let isValid = true;
        
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.style.borderColor = '#ef4444';
                input.style.animation = 'shake 0.5s ease-in-out';
                
                setTimeout(() => {
                    input.style.animation = '';
                }, 500);
            } else {
                input.style.borderColor = '';
            }
        });
        
        return isValid;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Handle responsive behavior
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Mobile-specific adjustments
            getElements('.card').forEach(card => {
                card.style.marginBottom = '1rem';
            });
        }
    }

    /**
     * Start real-time updates
     */
    startRealTimeUpdates() {
        setInterval(() => {
            // Simulate real-time updates
            if (Math.random() > 0.8) {
                this.userState.notifications++;
                this.updateNotificationBadge();
            }
        }, 10000);
    }

    /**
     * Update notification badge
     */
    updateNotificationBadge() {
        const badge = getElement('.notification-badge');
        if (badge) {
            badge.textContent = this.userState.notifications;
            badge.style.animation = 'notificationPulse 0.5s ease-in-out';
            setTimeout(() => {
                badge.style.animation = '';
            }, 500);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.showToast(message, 'warning');
    }

    /**
     * Show info message
     */
    showInfo(message) {
        this.showToast(message, 'info');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toastContainer = getElement('#toastContainer');
        if (!toastContainer) return;

        const toast = createElement('div', {
            className: `toast ${type}`,
            style: {
                transform: 'translateX(100%)',
                opacity: '0'
            }
        });

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>${icons[type] || icons.info}</span>
                <span>${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease';
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 50);

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, getConfig('UI.TOAST_DURATION'));
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.solutivaApp = new SolutivaCourtApp();
});

// Export for global access
export default SolutivaCourtApp; 