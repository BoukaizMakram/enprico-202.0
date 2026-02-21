/**
 * Stripe Integration for Enprico
 * Uses Stripe Checkout Sessions for payments
 */

// Plan configurations (CAD)
export const PLANS = {
    starter: {
        name: 'Flexible Plan',
        price: 250,
        currency: 'CAD',
        hours: 8,
        hoursPerWeek: 2,
        pricePerHour: 31.25,
        description: '2 hours of French tutoring per week ($31.25 CAD/hour)'
    },
    professional: {
        name: 'Standard Plan',
        price: 400,
        currency: 'CAD',
        hours: 16,
        hoursPerWeek: 4,
        pricePerHour: 25,
        description: '4 hours of French tutoring per week ($25 CAD/hour)'
    },
    enterprise: {
        name: 'Enterprise Plan',
        price: 0,
        currency: 'CAD',
        hours: 0,
        description: 'Custom plan for teams and organizations'
    }
};

/**
 * Create a Stripe Checkout Session
 * @param {Object} options - Checkout options
 * @param {string} options.planType - Plan type (starter, professional)
 * @param {string} options.userId - User ID (for existing users)
 * @param {string} options.registrationId - Registration ID (for new users)
 * @param {string} options.userEmail - User's email
 * @param {boolean} options.isNewUser - Whether this is a new user
 * @returns {Promise<Object>} Checkout session data with url
 */
export async function createCheckoutSession(options) {
    const response = await fetch('/api/stripe/create-checkout-session.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            planType: options.planType,
            userId: options.userId,
            registrationId: options.registrationId,
            userEmail: options.userEmail,
            isNewUser: options.isNewUser || false,
            successUrl: options.successUrl || window.location.origin + '/success.html?session_id={CHECKOUT_SESSION_ID}',
            cancelUrl: options.cancelUrl || window.location.origin + '/index.html#pricing'
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
    }

    return data;
}

/**
 * Redirect to Stripe Checkout for existing users
 * @param {string} planType - Plan type
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 */
export async function redirectToCheckout(planType, userId, userEmail) {
    const plan = PLANS[planType];

    if (!plan || plan.price === 0) {
        throw new Error('Invalid plan or custom pricing required');
    }

    const session = await createCheckoutSession({
        planType,
        userId,
        userEmail,
        isNewUser: false,
        successUrl: window.location.origin + '/success.html?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: window.location.origin + '/index.html#pricing'
    });

    // Redirect to Stripe
    window.location.href = session.url;
}

/**
 * Verify a completed checkout session
 * @param {string} sessionId - Stripe session ID
 * @returns {Promise<Object>} Verification result
 */
export async function verifyCheckoutSession(sessionId) {
    const response = await fetch('/api/stripe/verify-session.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Failed to verify session');
    }

    return data;
}

/**
 * Get plan details by type
 * @param {string} planType - Plan type
 * @returns {Object|null} Plan details
 */
export function getPlanDetails(planType) {
    return PLANS[planType] || null;
}

export default {
    createCheckoutSession,
    redirectToCheckout,
    verifyCheckoutSession,
    getPlanDetails,
    PLANS
};
