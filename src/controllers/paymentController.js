const stripeService = require('../services/stripeService');
const paypalService = require('../services/paypalService')

const createStripeSubscription = async (req, res) => {
    try {
        const { name, email, paymentMethodId, priceId, trial_end } = req.body;

        const result = await stripeService.createSubscription({
            name,
            email,
            paymentMethodId,
            priceId,
            trial_end
        });

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.status(201).json({ success: true, subscriptionId: result.id });
    } catch (error) {
        console.error("Subscription creation error:", error);
        res.status(500).json({ error: error.message });
    }
};

const cancelStripeSubscription = async (req, res) => {
    try {        
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }

        const result = await stripeService.cancelSubscription(id);
        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.status(200).json({
            success: true,
            subscriptionId: result.id,
            status: result.status
        });
    } catch (error) {
        console.error("Subscription cancellation error:", error);
        res.status(500).json({ error: error.message });
    }
};

const getPayPalListProducts = async (req, res) => {
    try {
        const result = await paypalService.getPayPalListProducts();

        console.log("Paypal get products", result);
        

        if (!result.success) {
            return res.status(400).json({ error: result.message })
        }        

        return res.status(200).json({ success: true, products: result.products, totalItems: result.total_items });
    } catch (error) {
        console.error("Error in getting products from paypal:", error);
        res.status(500).json({ error: error.message });
    }
}

const createPayPalProduct = async (req, res) => {
    try {
        const result = await paypalService.createPayPalProduct();

        if (!result.success) {
            return res.status(400).json({ error: result.message })
        }

        return res.status(200).json({ success: true, product: result.product });
    } catch (error) {
        console.error("Error in creating product on paypal:", error);
        res.status(500).json({ error: error.message });
    }
}

const getPayPalListPlans = async (req, res) => {
    try {
        const result = await paypalService.getListPlans();

        if (!result.success) {
            return res.status(400).json({ error: result.message })
        }

        return res.status(200).json({ success: true, plans: result.plans });
    } catch (error) {
        console.error("Error in getting plans from paypal:", error);
        res.status(500).json({ error: error.message });
    }
}

const createPayPalPlan = async (req, res) => {
    try {
        const { planPeriod, productID } = req.body;      

        const result = await paypalService.createBillingPlan(planPeriod, productID);

        if (!result.success) {
            return res.status(400).json({ error: result.message })
        }

        return res.status(200).json({ success: true, plan: result.plan });
    } catch (error) {
        console.error("Error in creating plan on paypal:", error);
        res.status(500).json({ error: error.message });
    }
}

const createPayPalSubscription = async (req, res) => {
    try {
        const { planId, subscriberDetails } = req.body;
        const returnUrl = `${process.env.CLIENT_URL}/paymentmethodV2`;
        const cancelUrl = `${process.env.CLIENT_URL}/paymentmethodV2`;

        const result = await paypalService.createSubscription(planId, subscriberDetails, returnUrl, cancelUrl);

        if (!result.success) {
            return res.status(400).json({ error: result.message })
        }

        return res.status(200).json({ success: true, subscription: result.subscription });
    } catch (error) {
        console.error("Error in creating plan on paypal:", error);
        res.status(500).json({ error: error.message });
    }
}

const cancelPayPalSubscription = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }

        const result = await paypalService.cancelSubscription(id, reason = "Not satisfied with the service");

        if (!result.success) {
            return res.status(400).json({ error: result.message })
        }

        return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error("Error in creating plan on paypal:", error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    createStripeSubscription,
    cancelStripeSubscription,
    getPayPalListProducts,
    createPayPalProduct,
    getPayPalListPlans,
    createPayPalPlan,
    createPayPalSubscription,
    cancelPayPalSubscription
}; 