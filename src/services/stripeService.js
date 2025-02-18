const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createSubscription = async ({ name, email, paymentMethodId, priceId, trial_end }) => {
    try {
        // Create a new customer
        const customer = await stripe.customers.create({
            name,
            email,
            payment_method: paymentMethodId,
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });

        // Create the subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            trial_end: trial_end || undefined,
            // expand: ['latest_invoice'],
        });

        return {
            success: true,
            id: subscription.id
        };
    } catch (error) {
        console.error('Stripe subscription error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const cancelSubscription = async (subscriptionId) => {
    try {        
        const subscription = await stripe.subscriptions.cancel(subscriptionId);

        return {
            success: true,
            id: subscription.id,
            status: subscription.status
        };
    } catch (error) {
        console.error('Stripe subscription cancellation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    createSubscription,
    cancelSubscription
}; 