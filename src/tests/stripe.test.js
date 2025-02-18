const request = require('supertest');
const app = require('../server');
const stripeService = require('../services/stripeService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

jest.mock('../services/stripeService');

describe('POST /api/payments/stripe/subscription', () => {
    const mockUserId = 36;
    const validSubscriptionData = {
        name: 'Test User',
        email: 'test@example.com',
        paymentMethodId: 'pm_test_123',
        priceId: 'price_test_123',
        trial_end: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 // 14 days from now
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a subscription successfully', async () => {
        const token = jwt.sign({ userId: mockUserId }, JWT_SECRET);
        const mockSubscriptionResult = {
            success: true,
            id: 'sub_test_123'
        };

        stripeService.createSubscription.mockResolvedValue(mockSubscriptionResult);

        const res = await request(app)
            .post('/api/payments/stripe/subscription')
            .set('Authorization', `Bearer ${token}`)
            .send(validSubscriptionData);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('success');
        expect(res.body.success).toEqual(mockSubscriptionResult.success);
        expect(res.body).toHaveProperty('subscriptionId');
        expect(res.body.subscriptionId).toEqual(mockSubscriptionResult.id);
    });

    it('should return 400 for invalid subscription data', async () => {
        const token = jwt.sign({ userId: mockUserId }, JWT_SECRET);
        const invalidData = {
            name: '',
            email: 'invalid-email',
            paymentMethodId: '',
            priceId: ''
        };

        const res = await request(app)
            .post('/api/payments/stripe/subscription')
            .set('Authorization', `Bearer ${token}`)
            .send(invalidData);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/payments/stripe/subscription')
            .send(validSubscriptionData);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authentication token is missing');
    });

    it('should return 500 for stripe service errors', async () => {
        const token = jwt.sign({ userId: mockUserId }, JWT_SECRET);
        stripeService.createSubscription.mockRejectedValue(new Error('Stripe API error'));

        const res = await request(app)
            .post('/api/payments/stripe/subscription')
            .set('Authorization', `Bearer ${token}`)
            .send(validSubscriptionData);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'Stripe API error');
    });
});

describe('DELETE /api/payments/stripe/subscription/:subscriptionId', () => {
    const mockUserId = 36;
    const mockSubscriptionId = 'sub_test_123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should cancel a subscription successfully', async () => {
        const token = jwt.sign({ userId: mockUserId }, JWT_SECRET);
        const mockCancellationResult = {
            success: true,
            id: mockSubscriptionId,
            status: 'canceled'
        };

        stripeService.cancelSubscription.mockResolvedValue(mockCancellationResult);

        const res = await request(app)
            .delete(`/api/payments/stripe/subscription/${mockSubscriptionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            subscriptionId: mockSubscriptionId,
            status: 'canceled'
        });
        expect(stripeService.cancelSubscription).toHaveBeenCalledWith(mockSubscriptionId);
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .delete(`/api/payments/stripe/subscription/${mockSubscriptionId}`);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Authentication token is missing');
    });

    it('should return 400 for invalid subscription ID', async () => {
        const token = jwt.sign({ userId: mockUserId }, JWT_SECRET);
        const mockErrorResult = {
            success: false,
            error: 'No such subscription: invalid_sub_id'
        };

        stripeService.cancelSubscription.mockResolvedValue(mockErrorResult);

        const res = await request(app)
            .delete('/api/payments/stripe/subscription/invalid_sub_id')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toBe('No such subscription: invalid_sub_id');
    });

    it('should return 500 for stripe service errors', async () => {
        const token = jwt.sign({ userId: mockUserId }, JWT_SECRET);
        stripeService.cancelSubscription.mockRejectedValue(new Error('Stripe API error'));

        const res = await request(app)
            .delete(`/api/payments/stripe/subscription/${mockSubscriptionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty('error', 'Stripe API error');
    });
}); 