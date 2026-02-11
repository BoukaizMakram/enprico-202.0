/**
 * Registration Client for Enprico
 * Handles multi-step registration form logic
 */

// Plan configurations
export const PLANS = {
    starter: {
        name: 'Starter Plan',
        price: 160,
        hours: 8,
        hoursPerWeek: 2,
        pricePerHour: 20,
        description: '2 hours of French tutoring per week'
    },
    professional: {
        name: 'Professional Plan',
        price: 288,
        hours: 16,
        hoursPerWeek: 4,
        pricePerHour: 18,
        description: '4 hours of French tutoring per week'
    }
};

// French levels
export const FRENCH_LEVELS = [
    { id: 'beginner', name: 'Beginner (A1-A2)', description: 'I know very little French' },
    { id: 'intermediate', name: 'Intermediate (B1-B2)', description: 'I can hold basic conversations' },
    { id: 'advanced', name: 'Advanced (C1-C2)', description: 'I am comfortable in most situations' },
    { id: 'native', name: 'Native/Fluent', description: 'I want to refine my skills' }
];

// Keep for backwards compatibility
export const ENGLISH_LEVELS = FRENCH_LEVELS;

// Learning goals
export const LEARNING_GOALS = [
    { id: 'canada', name: 'Immigration to Canada', icon: '🇨🇦' },
    { id: 'france', name: 'Immigration to France', icon: '🇫🇷' },
    { id: 'tef', name: 'TEF Exam Preparation', icon: '📝' },
    { id: 'tcf', name: 'TCF Exam Preparation', icon: '📋' },
    { id: 'conversation', name: 'Everyday Conversation', icon: '💬' },
    { id: 'business', name: 'Business French', icon: '💼' }
];

// Days of the week
export const DAYS = [
    { id: 'monday', name: 'Mon' },
    { id: 'tuesday', name: 'Tue' },
    { id: 'wednesday', name: 'Wed' },
    { id: 'thursday', name: 'Thu' },
    { id: 'friday', name: 'Fri' },
    { id: 'saturday', name: 'Sat' },
    { id: 'sunday', name: 'Sun' }
];

// Time preferences
export const TIME_SLOTS = [
    { id: 'morning', name: 'Morning', description: '6 AM - 12 PM' },
    { id: 'afternoon', name: 'Afternoon', description: '12 PM - 6 PM' },
    { id: 'evening', name: 'Evening', description: '6 PM - 11 PM' }
];

const STORAGE_KEY = 'enprico_registration';

/**
 * Registration Form Manager
 */
export class RegistrationForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.formData = this.loadFromStorage() || this.getDefaultData();
        this.errors = {};
    }

    getDefaultData() {
        return {
            // Step 1: Personal Info
            fullName: '',
            email: '',
            phone: '',

            // Step 2: English Level
            englishLevel: '',

            // Step 3: Learning Goals
            learningGoals: [],
            goalsDescription: '',

            // Step 4: Availability
            preferredDays: [],
            preferredTimes: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

            // Plan (from URL or localStorage)
            planType: localStorage.getItem('selectedPlan') || 'starter'
        };
    }

    // ==========================================
    // Storage
    // ==========================================

    saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.formData));
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                // Restore plan from selectedPlan if not in saved data
                if (!data.planType) {
                    data.planType = localStorage.getItem('selectedPlan') || 'starter';
                }
                return { ...this.getDefaultData(), ...data };
            }
        } catch (e) {
            console.error('Failed to load registration data:', e);
        }
        return null;
    }

    clearStorage() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('selectedPlan');
    }

    // ==========================================
    // Validation
    // ==========================================

    validateStep(step) {
        this.errors = {};

        switch (step) {
            case 1:
                return this.validatePersonalInfo();
            case 2:
                return this.validateEnglishLevel();
            case 3:
                return this.validateLearningGoals();
            case 4:
                return this.validateAvailability();
            case 5:
                return true; // Review step, no validation needed
            default:
                return true;
        }
    }

    validatePersonalInfo() {
        const { fullName, email } = this.formData;

        if (!fullName || fullName.trim().length < 2) {
            this.errors.fullName = 'Please enter your full name';
        }

        if (!email || !this.isValidEmail(email)) {
            this.errors.email = 'Please enter a valid email address';
        }

        return Object.keys(this.errors).length === 0;
    }

    validateEnglishLevel() {
        if (!this.formData.englishLevel) {
            this.errors.englishLevel = 'Please select your French level';
        }
        return Object.keys(this.errors).length === 0;
    }

    validateLearningGoals() {
        if (!this.formData.learningGoals || this.formData.learningGoals.length === 0) {
            this.errors.learningGoals = 'Please select at least one learning goal';
        }
        return Object.keys(this.errors).length === 0;
    }

    validateAvailability() {
        if (!this.formData.preferredDays || this.formData.preferredDays.length === 0) {
            this.errors.preferredDays = 'Please select at least one day';
        }

        if (!this.formData.preferredTimes || this.formData.preferredTimes.length === 0) {
            this.errors.preferredTimes = 'Please select at least one time preference';
        }

        return Object.keys(this.errors).length === 0;
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // ==========================================
    // Navigation
    // ==========================================

    nextStep() {
        if (this.validateStep(this.currentStep)) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.saveToStorage();
                return true;
            }
        }
        return false;
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            return true;
        }
        return false;
    }

    goToStep(step) {
        if (step >= 1 && step <= this.totalSteps) {
            this.currentStep = step;
            return true;
        }
        return false;
    }

    // ==========================================
    // Data Management
    // ==========================================

    updateField(field, value) {
        this.formData[field] = value;
        // Clear error for this field
        delete this.errors[field];
    }

    toggleArrayItem(field, item) {
        if (!Array.isArray(this.formData[field])) {
            this.formData[field] = [];
        }

        const index = this.formData[field].indexOf(item);
        if (index > -1) {
            this.formData[field].splice(index, 1);
        } else {
            this.formData[field].push(item);
        }

        // Clear error for this field
        delete this.errors[field];
    }

    // ==========================================
    // API Calls
    // ==========================================

    async checkEmailExists(email) {
        try {
            const response = await fetch('/api/registration/check-email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.exists;
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    }

    async submitRegistration() {
        // Validate all steps
        for (let step = 1; step <= 4; step++) {
            this.currentStep = step;
            if (!this.validateStep(step)) {
                throw new Error(`Please complete step ${step}`);
            }
        }

        // Prepare data for API (no password - will be auto-generated after payment)
        const registrationData = {
            email: this.formData.email.toLowerCase().trim(),
            fullName: this.formData.fullName.trim(),
            phone: this.formData.phone?.trim() || null,
            englishLevel: this.formData.englishLevel,
            learningGoals: this.formData.learningGoals,
            goalsDescription: this.formData.goalsDescription?.trim() || null,
            preferredDays: this.formData.preferredDays,
            preferredTimes: this.formData.preferredTimes,
            timezone: this.formData.timezone,
            planType: this.formData.planType
        };

        // Submit to API
        const response = await fetch('/api/registration/create-pending.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create registration');
        }

        return data;
    }

    async createCheckoutSessionForExistingUser(userId, userEmail) {
        const response = await fetch('/api/stripe/create-checkout-session.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                userEmail: userEmail,
                planType: this.formData.planType,
                isNewUser: false,
                successUrl: window.location.origin + '/success.html?session_id={CHECKOUT_SESSION_ID}',
                cancelUrl: window.location.origin + '/register.html?cancelled=true'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create checkout session');
        }

        return data;
    }

    async createCheckoutSession(registrationId) {
        const response = await fetch('/api/stripe/create-checkout-session.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                registrationId: registrationId,
                userEmail: this.formData.email,
                planType: this.formData.planType,
                isNewUser: true,
                successUrl: window.location.origin + '/success.html?session_id={CHECKOUT_SESSION_ID}',
                cancelUrl: window.location.origin + '/register.html?cancelled=true'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create checkout session');
        }

        return data;
    }

    // ==========================================
    // Summary Helpers
    // ==========================================

    getPlanDetails() {
        return PLANS[this.formData.planType] || PLANS.starter;
    }

    getEnglishLevelName() {
        const level = ENGLISH_LEVELS.find(l => l.id === this.formData.englishLevel);
        return level ? level.name : '';
    }

    getLearningGoalsNames() {
        return this.formData.learningGoals.map(goalId => {
            const goal = LEARNING_GOALS.find(g => g.id === goalId);
            return goal ? goal.name : goalId;
        });
    }

    getPreferredDaysNames() {
        return this.formData.preferredDays.map(dayId => {
            const day = DAYS.find(d => d.id === dayId);
            return day ? day.name : dayId;
        });
    }

    getPreferredTimesNames() {
        return this.formData.preferredTimes.map(timeId => {
            const time = TIME_SLOTS.find(t => t.id === timeId);
            return time ? `${time.name} (${time.description})` : timeId;
        });
    }
}

export default RegistrationForm;
