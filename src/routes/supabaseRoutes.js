const express = require('express');
const supabaseController = require('../controllers/supabaseController');
const { validateSignup, validateSignin, validateCreateSubscription, validateUpdateSubscription, validateCreateCat, validateUpdateCat, validateChatMessage, validateUpdateConversation, validateSigninOTP, validateVerifyOTP, validateSignupOTP } = require('../middlewares/validationMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', validateSignup, supabaseController.signup);
router.post('/signin', validateSignin, supabaseController.signin);
router.post('/signin-otp', validateSigninOTP, supabaseController.signinWithOTP);
router.post('/verify-otp', validateVerifyOTP, supabaseController.verifyOTP);
router.post('/signup-otp', validateSignupOTP, supabaseController.signupWithOTP);

router.get('/subscriptions', authenticateToken, supabaseController.getSubscription);
router.post('/subscriptions', authenticateToken, validateCreateSubscription, supabaseController.createSubscription);
router.put('/subscriptions/:id', authenticateToken, validateUpdateSubscription, supabaseController.updateSubscription);
router.delete('/subscriptions/:id', authenticateToken, supabaseController.deleteSubscription);

router.get('/cats', authenticateToken, supabaseController.getCats);
router.get('/cat/:id', authenticateToken, supabaseController.getCatById);
router.post('/cats', authenticateToken, validateCreateCat, supabaseController.createCat);
router.put('/cats/:id', authenticateToken, validateUpdateCat, supabaseController.updateCat);
router.delete('/cats/:id', authenticateToken, supabaseController.deleteCat);

router.post('/chat', authenticateToken, validateChatMessage, supabaseController.postChatMessage);

router.get('/conversations', authenticateToken, supabaseController.getAllConversations);
router.get('/conversations/:id', authenticateToken, supabaseController.getConversationByConversationId);
router.post('/conversations', authenticateToken, supabaseController.createConversation);
router.put('/conversations/:id', authenticateToken, validateUpdateConversation, supabaseController.updateConversation);
router.delete('/conversations/:id', authenticateToken, supabaseController.deleteConversation);

router.post('/password-reset/request', supabaseController.requestPasswordReset);
router.post('/password-reset/reset', supabaseController.resetPassword);

module.exports = router;
