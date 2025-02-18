const express = require('express');
const { validateCreateStripeSubscription } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');
const router = express.Router();

router.post('/stripe/subscription', authenticateToken, validateCreateStripeSubscription, paymentController.createStripeSubscription);
router.delete('/stripe/subscription/:id', authenticateToken, paymentController.cancelStripeSubscription);

router.get('/paypal/products', paymentController.getPayPalListProducts);
router.post('/paypal/product', paymentController.createPayPalProduct);
router.get('/paypal/plans', paymentController.getPayPalListPlans);
router.post('/paypal/plan', paymentController.createPayPalPlan);
router.post('/paypal/subscription', paymentController.createPayPalSubscription);
router.post('/paypal/subscription/:id', paymentController.cancelPayPalSubscription);

module.exports = router;