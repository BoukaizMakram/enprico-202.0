/**
 * PayPal Integration for Enprico
 * Handles subscription payments via PayPal
 */

// PayPal Configuration
const PAYPAL_CLIENT_ID = 'ARNZ2l3qkq9--TDcOZ_9s2uurfp5ls8VXupbWwziLT3ExRhsJjCfeoVW8IdiOmW6OYjN8LJIF0Hvuox_';

// Plan configurations (matches pricing on index.html)
export const PLANS = {
    starter: {
        name: 'Starter Plan',
        price: 160,
        hours: 8, // 2 hours per week x 4 weeks
        description: '2 hours of French tutoring per week ($20/hour)'
    },
    professional: {
        name: 'Professional Plan',
        price: 288,
        hours: 16, // 4 hours per week x 4 weeks
        description: '4 hours of French tutoring per week ($18/hour)'
    },
    enterprise: {
        name: 'Enterprise Plan',
        price: 0, // Custom pricing
        hours: 0,
        description: 'Custom plan for teams and organizations'
    }
};

/**
 * Load PayPal SDK dynamically
 */
export function loadPayPalSDK() {
    return new Promise((resolve, reject) => {
        if (window.paypal) {
            resolve(window.paypal);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`;
        script.async = true;

        script.onload = () => {
            if (window.paypal) {
                resolve(window.paypal);
            } else {
                reject(new Error('PayPal SDK failed to load'));
            }
        };

        script.onerror = () => {
            reject(new Error('Failed to load PayPal SDK'));
        };

        document.head.appendChild(script);
    });
}

/**
 * Initialize PayPal button for a specific plan
 */
export async function initPayPalButton(containerId, planType, onSuccess, onError) {
    const plan = PLANS[planType];

    if (!plan) {
        console.error('Invalid plan type:', planType);
        return;
    }

    try {
        const paypal = await loadPayPalSDK();

        paypal.Buttons({
            style: {
                shape: 'pill',
                color: 'blue',
                layout: 'vertical',
                label: 'pay'
            },

            // Create order when user clicks PayPal button
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        description: plan.description,
                        amount: {
                            currency_code: 'USD',
                            value: plan.price.toString()
                        },
                        custom_id: planType // Store plan type for reference
                    }]
                });
            },

            // Handle successful payment
            onApprove: async function(data, actions) {
                try {
                    // Capture the order
                    const orderData = await actions.order.capture();

                    console.log('Payment successful:', orderData);

                    // Call success callback with payment details
                    if (onSuccess) {
                        onSuccess({
                            orderId: data.orderID,
                            payerId: data.payerID,
                            planType: planType,
                            plan: plan,
                            orderData: orderData,
                            transactionId: orderData.purchase_units[0].payments.captures[0].id
                        });
                    }
                } catch (err) {
                    console.error('Error capturing order:', err);
                    if (onError) {
                        onError(err);
                    }
                }
            },

            // Handle errors
            onError: function(err) {
                console.error('PayPal error:', err);
                if (onError) {
                    onError(err);
                }
            },

            // Handle cancellation
            onCancel: function(data) {
                console.log('Payment cancelled:', data);
            }
        }).render(`#${containerId}`);

    } catch (err) {
        console.error('Failed to initialize PayPal button:', err);
        if (onError) {
            onError(err);
        }
    }
}

/**
 * Create subscription after successful payment
 */
export async function createSubscriptionAfterPayment(paymentData, supabaseClient, userId, userEmail, userName) {
    const { planType, plan, transactionId, orderId } = paymentData;

    try {
        // Import functions from auth-client
        const { createSubscription, recordPayment, sendAdminNotification } = await import('./auth-client.js');

        // Create subscription in database
        const { data: subscription, error: subError } = await createSubscription(
            userId,
            planType,
            plan.price,
            plan.hours,
            null // No PayPal subscription ID for one-time payments
        );

        if (subError) {
            throw new Error('Failed to create subscription: ' + subError.message);
        }

        // Record the payment
        const { data: payment, error: payError } = await recordPayment(
            userId,
            subscription.id,
            plan.price,
            transactionId,
            orderId
        );

        if (payError) {
            console.error('Failed to record payment:', payError);
        }

        // Send admin notification about payment
        sendAdminNotification('payment', userEmail || 'Unknown', userName || 'Unknown',
            `Plan: ${plan.name}\nAmount: $${plan.price}\nHours: ${plan.hours}\nTransaction ID: ${transactionId}`
        );

        return { subscription, payment };

    } catch (error) {
        console.error('Error creating subscription:', error);
        throw error;
    }
}

export default {
    loadPayPalSDK,
    initPayPalButton,
    createSubscriptionAfterPayment,
    PLANS
};
