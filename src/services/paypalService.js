const axios = require('axios');

// Base URL for PayPal API
const baseURL = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com/v1";

// Create an instance of axios with predefined headers and baseURL
let auth = "Basic " + Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET_KEY}`).toString('base64');

if (baseURL != "https://api-m.sandbox.paypal.com/v1") {
    const axios = require('axios');
    const qs = require('qs');

    let data = qs.stringify({
        'grant_type': 'client_credentials',
        'ignoreCache': 'true',
        'return_authn_schemes': 'true',
        'return_client_metadata': 'true',
        'return_unconsented_scopes': 'true'
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api-m.paypal.com/v1/oauth2/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': auth,
            'Cookie': 'l7_az=ccg14.slc'
        },
        data: data
    };

    axios.request(config)
        .then((response) => {
            auth = response.data.access_token;
        })
        .catch((error) => {
            console.log(error);
        });
}

const paypalAPI = axios.create({
    baseURL: baseURL,
    headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
    }
});

const PAYMENT_PREFERENCES = {
    auto_bill_outstanding: true,
    setup_fee: { value: "0", currency_code: "USD" },
    setup_fee_failure_action: "CONTINUE",
    payment_failure_threshold: 3
};

// Common taxes
const TAXES = { percentage: "0", inclusive: false };

const MONTHLY_PLAN = (productId) => {
    return {
        product_id: productId,
        name: "Monthly Subscription Plan",
        description: "Monthly plan with a 3-day free trial",
        status: "ACTIVE",
        billing_cycles: [
            {
                frequency: { interval_unit: "DAY", interval_count: 1 },
                tenure_type: "TRIAL",
                sequence: 1,
                total_cycles: 3,
                pricing_scheme: {
                    fixed_price: { value: "0", currency_code: "USD" }
                }
            },
            {
                frequency: { interval_unit: "MONTH", interval_count: 1 },
                tenure_type: "REGULAR",
                sequence: 2,
                total_cycles: 12,
                pricing_scheme: {
                    fixed_price: { value: "49.99", currency_code: "USD" }
                }
            }
        ],
        payment_preferences: PAYMENT_PREFERENCES,
        taxes: TAXES
    };
};

const ANNUAL_PLAN = (productId) => {
    return {
        product_id: productId,
        name: "Annual Subscription Plan",
        description: "Annual plan with a 7-day free trial",
        status: "ACTIVE",
        billing_cycles: [
            {
                frequency: { interval_unit: "DAY", interval_count: 1 },
                tenure_type: "TRIAL",
                sequence: 1,
                total_cycles: 7,
                pricing_scheme: {
                    fixed_price: { value: "0", currency_code: "USD" }
                }
            },
            {
                frequency: { interval_unit: "YEAR", interval_count: 1 },
                tenure_type: "REGULAR",
                sequence: 2,
                total_cycles: 1,
                pricing_scheme: {
                    fixed_price: { value: "299.99", currency_code: "USD" }
                }
            }
        ],
        payment_preferences: PAYMENT_PREFERENCES,
        taxes: TAXES
    };
};

//Function to get a PayPal products
const getPayPalListProducts = async () => {
    try {
        const { data } = await paypalAPI.get("/catalogs/products?total_required=true");

        return {
            success: true,
            products: data.products,
            total_items: data.total_items,
            message: "Successfully retrieved the list of products from PayPal"
        };

    } catch (error) {
        console.error("Error getting PayPal products:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get products",
        };
    }
};

// Function to create a PayPal product
const createPayPalProduct = async () => {
    const payload = {
        name: "Cat care AI Service",
        description: "Cat care AI service",
        type: "SERVICE",
        category: "SOFTWARE",
    };

    try {
        paypalAPI.defaults.headers['PayPal-Request-Id'] = `PRODUCT-${Date.now()}`;

        const response = await paypalAPI.post("/catalogs/products", payload);

        return {
            success: true,
            product: response.data,
            message: "Product created successfully",
        };
    } catch (error) {
        console.error("Error creating PayPal product:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to create product",
        };
    }
};

// Service function to fetch the list of PayPal plans
const getListPlans = async () => {
    try {
        // Fetch the list of plans

        const response = await paypalAPI.get('/billing/plans?sort_by=create_time&sort_order=desc');

        const plans = response.data.plans;

        // Return success response
        return {
            success: true,
            plans,
            message: "Successfully retrieved the list of plans from PayPal"
        };
    } catch (error) {
        // Handle errors and provide meaningful feedback
        console.error("Error fetching PayPal plans:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to fetch the list of plans from PayPal"
        };
    }
};

// Function to create a PayPal billing plan
const createBillingPlan = async (planPeriod, productID) => {

    const planDetails = planPeriod === "Monthly" ? MONTHLY_PLAN(productID) : ANNUAL_PLAN(productID);

    try {
        paypalAPI.defaults.headers['PayPal-Request-Id'] = `PLAN-${Date.now()}`;

        const response = await paypalAPI.post(
            "/billing/plans",
            planDetails,
        );
        return {
            success: true,
            plan: response.data,
            message: "Plan created successfully"
        };
    } catch (error) {
        console.error("Error creating billing plan:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to create billing plan"
        };
    }
};

// Function to create a subscription
const createSubscription = async (planId, subscriberDetails, returnUrl, cancelUrl) => {
    try {
        paypalAPI.defaults.headers['PayPal-Request-Id'] = `SUBSCRIPTION-${Date.now()}`;

        const response = await paypalAPI.post(
            '/billing/subscriptions',
            {
                plan_id: planId,
                start_time: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(), // Start in 1 hour
                subscriber: subscriberDetails,
                application_context: {
                    brand_name: "YourBrandName",
                    locale: "en-US",
                    shipping_preference: "SET_PROVIDED_ADDRESS",
                    user_action: "SUBSCRIBE_NOW",
                    payment_method: {
                        payer_selected: "PAYPAL",
                        payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
                    },
                    return_url: returnUrl,
                    cancel_url: cancelUrl,
                },
            },
        );

        return {
            success: true,
            subscription: response.data,
            message: "Subscription created successfully",
        };
    } catch (error) {
        console.error("Error creating subscription:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to create subscription",
        };
    }
};

const cancelSubscription = async (id, reason) => {
    try {
        const data = { reason: reason }; // Ensure that data is sent as a proper JSON object
        await paypalAPI.post(`/billing/subscriptions/${id}/cancel`, data);

        return {
            success: true,
            message: "Subscription canceled successfully",
        };
    } catch (error) {
        console.error("Error canceling subscription:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to cancel subscription",
        };
    }
};

module.exports = {
    getListPlans,
    createBillingPlan,
    createSubscription,
    cancelSubscription,
    getPayPalListProducts,
    createPayPalProduct
};
