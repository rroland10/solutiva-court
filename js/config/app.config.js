/**
 * Solutiva Court Application Configuration
 * Centralized configuration for all app settings
 */

export const APP_CONFIG = {
    // Application Metadata
    APP_NAME: 'Solutiva Court',
    APP_VERSION: '4.0.0',
    APP_DESCRIPTION: 'Next Generation Justice - Decentralized Dispute Resolution Platform',
    
    // API Configuration
    API: {
        BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3,
    },
    
    // Blockchain Configuration
    BLOCKCHAIN: {
        NETWORK_ID: process.env.NETWORK_ID || '1', // Mainnet
        CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x...',
        GAS_LIMIT: 3000000,
        GAS_PRICE: '20000000000', // 20 Gwei
    },
    
    // UI Configuration
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 5000,
        MODAL_BACKDROP_BLUR: 5,
        CARD_HOVER_DELAY: 200,
    },
    
    // User Configuration
    USER: {
        MIN_TRUST_SCORE: 50,
        MAX_TRUST_SCORE: 100,
        JURY_MIN_AGE: 18,
        KYC_REQUIRED: true,
    },
    
    // Dispute Configuration
    DISPUTE: {
        MIN_COLLATERAL: 10, // EOS
        MAX_COLLATERAL: 10000, // EOS
        JURY_SIZE: 6,
        VOTING_PERIOD: 24 * 60 * 60 * 1000, // 24 hours in ms
        EVIDENCE_REVIEW_PERIOD: 12 * 60 * 60 * 1000, // 12 hours in ms
        APPEAL_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    },
    
    // Token Configuration
    TOKEN: {
        SYMBOL: 'DRT',
        DECIMALS: 18,
        MIN_STAKE: 100,
        REWARD_RATE: 0.05, // 5% annual return
        PENALTY_RATE: 0.1, // 10% penalty for bad behavior
    },
    
    // Privacy Configuration
    PRIVACY: {
        ZKSNARK_ENABLED: true,
        ANONYMOUS_VOTING: true,
        EVIDENCE_ENCRYPTION: true,
        DATA_RETENTION_DAYS: 365,
    },
    
    // Feature Flags
    FEATURES: {
        REAL_TIME_UPDATES: true,
        PUSH_NOTIFICATIONS: true,
        MOBILE_APP: false,
        MULTI_LANGUAGE: false,
        DARK_MODE: true,
    },
    
    // Animation Configuration
    ANIMATIONS: {
        ENABLED: true,
        REDUCED_MOTION: false,
        PERFORMANCE_MODE: false,
    },
    
    // Error Configuration
    ERROR: {
        SHOW_DETAILS: process.env.NODE_ENV === 'development',
        LOG_TO_CONSOLE: true,
        SEND_TO_ANALYTICS: true,
    },
};

// Environment-specific configurations
export const ENV_CONFIG = {
    development: {
        DEBUG: true,
        LOG_LEVEL: 'debug',
        MOCK_DATA: true,
    },
    production: {
        DEBUG: false,
        LOG_LEVEL: 'error',
        MOCK_DATA: false,
    },
    test: {
        DEBUG: true,
        LOG_LEVEL: 'debug',
        MOCK_DATA: true,
    },
};

// Get current environment
export const getCurrentEnv = () => {
    return process.env.NODE_ENV || 'development';
};

// Get environment-specific config
export const getEnvConfig = () => {
    const env = getCurrentEnv();
    return ENV_CONFIG[env] || ENV_CONFIG.development;
};

// Utility function to get config value
export const getConfig = (path) => {
    const keys = path.split('.');
    let value = APP_CONFIG;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return undefined;
        }
    }
    
    return value;
};

// Validate configuration
export const validateConfig = () => {
    const required = [
        'APP_NAME',
        'APP_VERSION',
        'BLOCKCHAIN.NETWORK_ID',
        'DISPUTE.JURY_SIZE',
        'TOKEN.SYMBOL',
    ];
    
    const missing = [];
    
    for (const path of required) {
        if (!getConfig(path)) {
            missing.push(path);
        }
    }
    
    if (missing.length > 0) {
        console.error('Missing required configuration:', missing);
        return false;
    }
    
    return true;
};

export default APP_CONFIG; 