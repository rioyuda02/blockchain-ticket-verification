const request = require('supertest');
const app = require('../server'); // Assuming you export the Express app from server.js
const supabase = require('../services/supabaseConnection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const openaiService = require('../services/openaiService');

jest.mock('../services/supabaseConnection');
jest.mock('../services/openaiService');

describe('POST /api/supabase/signup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new user and return a token', async () => {
        supabase.createUserInDatabase.mockResolvedValue({ ID: 1 });

        const res = await request(app)
            .post('/api/supabase/signup')
            .send({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe2@example.com',
                password: 'StrongPassword@123'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('expiresIn');
        expect(typeof res.body.token).toBe('string');
        expect(typeof res.body.expiresIn).toBe('string');
    });

    it('should return 400 for invalid input', async () => {
        const res = await request(app)
            .post('/api/supabase/signup')
            .send({
                first_name: '',
                last_name: 'Doe',
                email: 'invalid-email',
                password: 'weak'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.messages).toContain('First name cannot be empty');
        expect(res.body.messages).toContain('Invalid email format');
        expect(res.body.messages[2]).toMatch(/Password must be at least 8 characters long/);
    });

    it('should return 409 for existing email', async () => {
        supabase.createUserInDatabase.mockRejectedValue(new Error('duplicate key value violates unique constraint'));

        const res = await request(app)
            .post('/api/supabase/signup')
            .send({
                first_name: 'John',
                last_name: 'Doe',
                email: 'existing@example.com',
                password: 'StrongPassword@123'
            });

        expect(res.statusCode).toBe(409);
        expect(res.body.message).toBe('Email already in use');
    });

    it('should return 500 for unexpected errors', async () => {
        supabase.createUserInDatabase.mockRejectedValue(new Error('Unexpected error'));

        const res = await request(app)
            .post('/api/supabase/signup')
            .send({
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                password: 'StrongPassword@123'
            });

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('An unexpected error occurred');
    });
});

describe('POST /api/supabase/signin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should sign in a user and return a token', async () => {
        const hashedPassword = await bcrypt.hash('StrongPassword@123', 10);
        supabase.findUserByEmail.mockResolvedValue({
            id: 1,
            email: 'john.doe@example.com',
            password: hashedPassword
        });

        const res = await request(app)
            .post('/api/supabase/signin')
            .send({
                email: 'john.doe@example.com',
                password: 'StrongPassword@123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('expiresIn');
    });

    it('should return 401 for non-existent user', async () => {
        supabase.findUserByEmail.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/supabase/signin')
            .send({
                email: 'nonexistent@example.com',
                password: 'StrongPassword@123'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('User not found');
    });

    it('should return 401 for incorrect password', async () => {
        const hashedPassword = await bcrypt.hash('StrongPassword@123', 10);
        supabase.findUserByEmail.mockResolvedValue({
            id: 1,
            email: 'john.doe@example.com',
            password: hashedPassword
        });

        const res = await request(app)
            .post('/api/supabase/signin')
            .send({
                email: 'john.doe@example.com',
                password: 'WrongPassword'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Incorrect password');
    });

    it('should return 400 for invalid input', async () => {
        const res = await request(app)
            .post('/api/supabase/signin')
            .send({
                email: 'invalid-email',
                password: ''
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.messages).toContain('Invalid email format');
        expect(res.body.messages).toContain("\"password\" is not allowed to be empty");
    });
});

describe('GET /api/supabase/subscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return subscription for authenticated user', async () => {
        const token = jwt.sign({ userId: 1 }, JWT_SECRET);
        supabase.getSubscriptionByUserId.mockResolvedValue({
            id: 1,
            plan: 'Basic',
            end_date: '2029-12-31',
            start_date: '2024-01-01',
            provider: 'PayPal',
            billing_period: 'Monthly'
        });

        const res = await request(app)
            .get('/api/supabase/subscriptions')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('plan');
        expect(res.body).toHaveProperty('end_date');
    });

    it('should return 404 if no subscription found', async () => {
        const token = jwt.sign({ userId: 36 }, JWT_SECRET);
        supabase.getSubscriptionByUserId.mockResolvedValue(null);

        const res = await request(app)
            .get('/api/supabase/subscriptions')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('No subscription found for this user.');
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .get('/api/supabase/subscriptions');

        expect(res.statusCode).toBe(401);
    });
});

describe('POST /api/supabase/subscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a subscription for authenticated user', async () => {
        const token = jwt.sign({ userId: 37 }, JWT_SECRET);
        supabase.checkExistingSubscription.mockResolvedValue(false);
        supabase.createSubscriptionForUserId.mockResolvedValue({
            id: 1,
            user_id: 1,
            plan: 'Basic',
            end_date: '2029-12-31',
            start_date: '2024-01-01',
            provider: 'PayPal',
            billing_period: 'Monthly'
        });

        const res = await request(app)
            .post('/api/supabase/subscriptions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                plan: 'Basic',
                end_date: '2029-12-31',
                start_date: '2025-01-01',
                provider: 'PayPal',
                billing_period: 'Monthly'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('user_id');
        expect(res.body).toHaveProperty('plan');
        expect(res.body).toHaveProperty('end_date');
        expect(res.body).toHaveProperty('start_date');
        expect(res.body).toHaveProperty('provider');
        expect(res.body).toHaveProperty('billing_period');
    });

    it('should return 400 if user already has a subscription', async () => {
        const token = jwt.sign({ userId: 37 }, JWT_SECRET);
        supabase.checkExistingSubscription.mockResolvedValue(true);

        const res = await request(app)
            .post('/api/supabase/subscriptions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                plan: 'Basic',
                end_date: '2029-12-31',
                start_date: '2025-01-01',
                provider: 'PayPal',
                billing_period: 'Monthly'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('User already has a subscription');
    });

    it('should return 400 for invalid input', async () => {
        const token = jwt.sign({ userId: 1 }, JWT_SECRET);

        const res = await request(app)
            .post('/api/supabase/subscriptions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                plan: 'InvalidPlan',
                end_date: 'invalid-date'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/supabase/subscriptions')
            .send({
                plan: 'Basic',
                end_date: '2029-12-31'
            });

        expect(res.statusCode).toBe(401);
    });
});

describe('PUT /api/supabase/subscriptions/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update subscription for authenticated user', async () => {
        const userId = Math.floor(Math.random() * 1000) + 1; // Generate a random userId
        const token = jwt.sign({ userId }, JWT_SECRET);
        const subscriptionId = Math.floor(Math.random() * 100) + 1; // Generate a random subscriptionId

        supabase.updateSubscriptionForUserId.mockResolvedValue({
            id: subscriptionId,
            user_id: userId,
            plan: 'Premium',
            end_date: '2024-12-31',
            start_date: '2024-01-01',
            provider: 'PayPal',
            billing_period: 'Monthly'
        });

        const res = await request(app)
            .put(`/api/supabase/subscriptions/${subscriptionId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                plan: 'Premium',
                end_date: '2024-12-31',
                start_date: '2024-01-01',
                provider: 'PayPal',
                billing_period: 'Monthly'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', subscriptionId);
        expect(res.body).toHaveProperty('user_id', userId);
        expect(res.body.plan).toBe('Premium');
        expect(res.body.end_date).toBe('2024-12-31');
        expect(res.body.start_date).toBe('2024-01-01');
        expect(res.body.provider).toBe('PayPal');
        expect(res.body.billing_period).toBe('Monthly');
    });

    it('should return 404 if no subscription found', async () => {
        const userId = Math.floor(Math.random() * 1000) + 1;
        const token = jwt.sign({ userId }, JWT_SECRET);
        const subscriptionId = Math.floor(Math.random() * 100) + 1;

        supabase.updateSubscriptionForUserId.mockResolvedValue(null);

        const res = await request(app)
            .put(`/api/supabase/subscriptions/${subscriptionId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                plan: 'Premium',
                end_date: '2024-12-31',
                start_date: '2024-01-01',
                provider: 'PayPal',
                billing_period: 'Monthly'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Subscription not found');
    });

    it('should return 400 for invalid input', async () => {
        const token = jwt.sign({ userId: 36 }, JWT_SECRET);
        const subscriptionId = 9;
        const res = await request(app)
            .put(`/api/supabase/subscriptions/${subscriptionId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                plan: 'InvalidPlan',
                end_date: 'invalid-date',
                start_date: 'invalid-date',
                provider: 'InvalidProvider',
                billing_period: 'InvalidBillingPeriod'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    it('should return 401 for unauthenticated request', async () => {
        const subscriptionId = 9;
        const res = await request(app)
            .put(`/api/supabase/subscriptions/${subscriptionId}`)
            .send({
                plan: 'Premium',
                end_date: '2024-12-31',
                start_date: '2024-01-01',
                provider: 'PayPal',
                billing_period: 'Monthly'
            });

        expect(res.statusCode).toBe(401);
    });
});

describe('DELETE /api/supabase/subscriptions/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete subscription for authenticated user', async () => {
        const userId = 36;
        const subscriptionId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteSubscriptionForUserId.mockResolvedValue({ success: true });

        const res = await request(app)
            .delete(`/api/supabase/subscriptions/${subscriptionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Subscription deleted successfully');
        expect(supabase.deleteSubscriptionForUserId).toHaveBeenCalledWith(subscriptionId.toString(), userId);
    });

    it('should return 404 if subscription not found', async () => {
        const userId = 36;
        const subscriptionId = 999;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteSubscriptionForUserId.mockResolvedValue({ error: 'not_found' });

        const res = await request(app)
            .delete(`/api/supabase/subscriptions/${subscriptionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Subscription not found');
    });

    it('should return 403 if user not authorized to delete subscription', async () => {
        const userId = 36;
        const subscriptionId = 2;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteSubscriptionForUserId.mockResolvedValue({ error: 'not_authorized' });

        const res = await request(app)
            .delete(`/api/supabase/subscriptions/${subscriptionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('User not authorized to delete this subscription');
    });

    it('should return 401 for unauthenticated request', async () => {
        const subscriptionId = 1;

        const res = await request(app)
            .delete(`/api/supabase/subscriptions/${subscriptionId}`);

        expect(res.statusCode).toBe(401);
    });

    it('should return 500 for unexpected errors', async () => {
        const userId = 36;
        const subscriptionId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteSubscriptionForUserId.mockRejectedValue(new Error('Unexpected error'));

        const res = await request(app)
            .delete(`/api/supabase/subscriptions/${subscriptionId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('An error occurred while deleting the subscription');
    });
});

describe('GET /api/supabase/cats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return cats for authenticated user', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);
        const mockCats = [
            { id: 1, name: 'Whiskers', goals: 'Weight loss', issues_faced: 'Overweight', required_progress: '1 kg', food_bowls: 'Ceramic bowls', treats: 'Fish-flavored treats', playtime: '30 minutes daily' },
            { id: 2, name: 'Fluffy', goals: 'Weight loss', issues_faced: 'Overweight', required_progress: '1 kg', food_bowls: 'Ceramic bowls', treats: 'Fish-flavored treats', playtime: '30 minutes daily' }
        ];

        supabase.getCatsByUserId.mockResolvedValue(mockCats);

        const res = await request(app)
            .get('/api/supabase/cats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockCats);
        expect(supabase.getCatsByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return 404 if no cats found', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.getCatsByUserId.mockResolvedValue([]);

        const res = await request(app)
            .get('/api/supabase/cats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: 'No cats found for this user.' });
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .get('/api/supabase/cats');

        expect(res.statusCode).toBe(401);
    });

    it('should return 500 for unexpected errors', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.getCatsByUserId.mockRejectedValue(new Error('Unexpected error'));

        const res = await request(app)
            .get('/api/supabase/cats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'An error occurred while fetching the cats' });
    });
});

describe('POST /api/supabase/cats', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a cat for authenticated user and return AI recommendations', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);
        const mockCat = {
            name: 'Whiskers',
            breed: 'Persian',
            age: 3,
            goal: 'Weight loss',
            issues_faced: 'Overweight',
            activity_level: 'Low',
            gender: 'Male',
            country: 'USA',
            zipcode: '12345',
            weight: 6.5,
            target_weight: 5.5,
            required_progress: '1 kg',
            check_in_period: 'Weekly',
            training_days: '5',
        };
        const mockRecommendations = {
            food_bowls: 'Ceramic bowls',
            treats: 'Fish-flavored treats',
            playtime: '30 minutes daily'
        };
        const mockUpdatedCat = {
            ...mockCat,
            ...mockRecommendations
        };

        supabase.createCatByUserId.mockResolvedValue(mockCat);
        openaiService.getRecommendations.mockResolvedValue(mockRecommendations);
        supabase.updateCatRecommendationsByCatId.mockResolvedValue(mockUpdatedCat);

        const res = await request(app)
            .post('/api/supabase/cats')
            .set('Authorization', `Bearer ${token}`)
            .send(mockCat);

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual(mockUpdatedCat);
        expect(supabase.createCatByUserId).toHaveBeenCalledWith(userId, mockCat);
        expect(openaiService.getRecommendations).toHaveBeenCalledWith(mockCat);
        expect(supabase.updateCatRecommendationsByCatId).toHaveBeenCalledWith(mockCat.id, mockRecommendations);
    });

    it('should return 400 for invalid input', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        const res = await request(app)
            .post('/api/supabase/cats')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: '',
                breed: 'Persian',
                age: 'not a number'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.messages).toContain('"name" is not allowed to be empty');
        expect(res.body.messages).toContain('Age must be a number');
        expect(res.body.messages).toContain('Goal is required');
        expect(res.body.messages).toContain('Activity level is required');
        expect(res.body.messages).toContain('Gender is required');
        expect(res.body.messages).toContain('Country is required');
        expect(res.body.messages).toContain('Zipcode is required');
        expect(res.body.messages).toContain('Weight is required');
        expect(res.body.messages).toContain('Target weight is required');
        expect(res.body.messages).toContain('Required progress is required');
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/supabase/cats')
            .send({
                name: 'Whiskers',
                breed: 'Persian',
                age: 3
            });

        expect(res.statusCode).toBe(401);
    });

    it('should return 500 for unexpected errors', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.createCatByUserId.mockRejectedValue(new Error('Unexpected error'));

        const mockCat = {
            name: 'Whiskers',
            breed: 'Persian',
            age: 3,
            goal: 'Weight loss',
            issues_faced: 'Overweight',
            activity_level: 'Low',
            gender: 'Male',
            country: 'USA',
            zipcode: '12345',
            weight: 6.5,
            target_weight: 5.5,
            required_progress: '1 kg',
            check_in_period: 'Weekly',
            training_days: '5',
        };

        const res = await request(app)
            .post('/api/supabase/cats')
            .set('Authorization', `Bearer ${token}`)
            .send(mockCat);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'An error occurred while creating the cat' });
    });
});

describe('PUT /api/supabase/cats/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should update a cat for authenticated user', async () => {
        const userId = 36;
        const catId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);
        const mockUpdatedCat = {
            name: 'Whiskers',
            breed: 'Persian',
            age: 3,
            weight: 6.5,
            target_weight: 5.5,
            activity_level: 'Low',
            goal: 'Weight loss',
            issues_faced: 'Overweight',
            gender: 'Male',
            country: 'USA',
            zipcode: '12345',
            required_progress: '1 kg',
            check_in_period: 'Weekly',
            training_days: '5',
            food_bowls: 'Ceramic bowls',
            treats: 'Fish-flavored treats',
            playtime: '30 minutes daily'
        };

        supabase.updateCatById.mockResolvedValue(mockUpdatedCat);

        const res = await request(app)
            .put(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Whiskers',
                age: 3,
                weight: 6.5,
                target_weight: 5.5,
                activity_level: 'Low'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(expect.objectContaining(mockUpdatedCat));
        expect(supabase.updateCatById).toHaveBeenCalledWith(catId.toString(), userId, expect.any(Object));
    });

    it('should update a cat and return AI recommendations when weight, target_weight, or activity_level change', async () => {
        const userId = 36;
        const catId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);
        const mockUpdatedCat = {
            id: catId,
            name: 'Whiskers',
            breed: 'Persian',
            age: 4,
            weight: 5.5,
            target_weight: 5.0,
            activity_level: 'Medium'
        };
        const mockRecommendations = {
            food_bowls: 'Ceramic bowls',
            treats: 'Low-calorie treats',
            playtime: '45 minutes daily'
        };
        const mockFinalUpdatedCat = {
            ...mockUpdatedCat,
            ...mockRecommendations
        };

        supabase.updateCatById.mockResolvedValue(mockUpdatedCat);
        openaiService.getRecommendations.mockResolvedValue(mockRecommendations);
        supabase.updateCatRecommendationsByCatId.mockResolvedValue(mockFinalUpdatedCat);

        const res = await request(app)
            .put(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                weight: 5.5,
                target_weight: 5.0,
                activity_level: 'Medium'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockFinalUpdatedCat);
        expect(supabase.updateCatById).toHaveBeenCalledWith(catId.toString(), userId, expect.any(Object));
        expect(openaiService.getRecommendations).toHaveBeenCalledWith(mockUpdatedCat);
        expect(supabase.updateCatRecommendationsByCatId).toHaveBeenCalledWith(catId.toString(), mockRecommendations);
    });

    it('should return 404 if cat not found or user not authorized', async () => {
        const userId = 36;
        const catId = 999;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.updateCatById.mockResolvedValue(null);

        const res = await request(app)
            .put(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Whiskers',
                age: 4
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Cat not found');
    });

    it('should return 400 for invalid input', async () => {
        const userId = 36;
        const catId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        const res = await request(app)
            .put(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: '',
                age: 'not a number'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.messages).toContain('"name" is not allowed to be empty');
        expect(res.body.messages).toContain('"age" must be a number');
    });

    it('should return 401 for unauthenticated request', async () => {
        const catId = 1;

        const res = await request(app)
            .put(`/api/supabase/cats/${catId}`)
            .send({
                name: 'Whiskers',
                age: 4
            });

        expect(res.statusCode).toBe(401);
    });

    it('should return 500 for unexpected errors', async () => {
        const userId = 36;
        const catId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.updateCatById.mockRejectedValue(new Error('Unexpected error'));

        const res = await request(app)
            .put(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Whiskers',
                age: 4
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: 'An error occurred while updating the cat' });
    });
});

describe('DELETE /api/supabase/cats/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a cat for authenticated user', async () => {
        const userId = 36;
        const catId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteCatById.mockResolvedValue({ success: true });

        const res = await request(app)
            .delete(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Cat deleted successfully');
        expect(supabase.deleteCatById).toHaveBeenCalledWith(catId.toString(), userId);
    });

    it('should return 404 if cat not found', async () => {
        const userId = 36;
        const catId = 999;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteCatById.mockResolvedValue({ error: 'not_found' });

        const res = await request(app)
            .delete(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Cat not found');
    });

    it('should return 403 if user not authorized to delete cat', async () => {
        const userId = 36;
        const catId = 2;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteCatById.mockResolvedValue({ error: 'not_authorized' });

        const res = await request(app)
            .delete(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('User not authorized to delete this cat');
    });

    it('should return 401 for unauthenticated request', async () => {
        const catId = 1;

        const res = await request(app)
            .delete(`/api/supabase/cats/${catId}`);

        expect(res.statusCode).toBe(401);
    });

    it('should return 500 for unexpected errors', async () => {
        const userId = 36;
        const catId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteCatById.mockRejectedValue(new Error('Unexpected error'));

        const res = await request(app)
            .delete(`/api/supabase/cats/${catId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('An error occurred while deleting the cat');
    });
});

describe('GET /api/supabase/conversations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return conversations for authenticated user', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);
        const mockConversations = [
            {
                id: 1,
                started_at: '2029-06-01T12:00:00Z',
                messages: [
                    {
                        message: 'Hello',
                        sent_by: 'user',
                        timestamp: '2029-06-01T12:00:00Z'
                    },
                    {
                        message: 'Hi there!',
                        sent_by: 'system',
                        timestamp: '2029-06-01T12:01:00Z'
                    }
                ]
            }
        ];

        supabase.getConversationsByUserId.mockResolvedValue(mockConversations);

        const res = await request(app)
            .get('/api/supabase/conversations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockConversations);
        expect(supabase.getConversationsByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return 404 if no conversations found', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.getConversationsByUserId.mockResolvedValue([]); // Ensure this returns an empty array

        const res = await request(app)
            .get('/api/supabase/conversations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({ message: "No conversations found for this user." });
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .get('/api/supabase/conversations'); // No token set

        expect(res.statusCode).toBe(401);
    });

    it('should return 500 for unexpected errors', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.getConversationsByUserId.mockRejectedValue(new Error('Unexpected error'));

        const res = await request(app)
            .get('/api/supabase/conversations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body).toEqual({ error: "An error occurred while fetching the conversations" });
    });
});

describe('POST /api/supabase/conversations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new conversation for authenticated user', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);
        const mockConversation = { id: 8, user_id: userId, started_at: '2029-06-01T12:00:00Z' };

        supabase.createConversation.mockResolvedValue(mockConversation);

        const res = await request(app)
            .post('/api/supabase/conversations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual({ id: mockConversation.id });
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/supabase/conversations');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Authentication token is missing');
    });

    it('should return 401 for invalid token', async () => {
        const res = await request(app)
            .post('/api/supabase/conversations')
            .set('Authorization', 'Bearer invalid_token');

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Invalid token. User not authenticated.');
    });

    it('should return 500 if conversation creation fails', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.createConversation.mockRejectedValue(new Error('Database error'));

        const res = await request(app)
            .post('/api/supabase/conversations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('An error occurred while creating the conversation');
    });

    it('should return 400 if user already has maximum allowed conversations', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.createConversation.mockResolvedValue({ error: 'Maximum number of conversations reached' });

        const res = await request(app)
            .post('/api/supabase/conversations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('Maximum number of conversations reached');
    });

    it('should handle unexpected response from createConversation', async () => {
        const userId = 36;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.createConversation.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/supabase/conversations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('An error occurred while creating the conversation');
    });
});

describe('PUT /api/supabase/conversations/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        supabase.updateConversation = jest.fn();
    });

    it('should update a conversation for authenticated user', async () => {
        const userId = 36;
        const conversationId = 8;
        const token = jwt.sign({ userId }, JWT_SECRET);

        const mockUpdatedConversation = { success: true, message: "Conversation updated successfully" };

        supabase.updateConversation.mockResolvedValue(mockUpdatedConversation);

        const res = await request(app)
            .put(`/api/supabase/conversations/${conversationId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ messages: [{ role: 'user', content: 'Hello, how are you?' }] });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockUpdatedConversation);
    });

    it('should return 400 if messages is not an array', async () => {
        const userId = 36;
        const conversationId = 8;
        const token = jwt.sign({ userId }, JWT_SECRET);

        const res = await request(app)
            .put(`/api/supabase/conversations/${conversationId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ messages: 'Not an array' });

        expect(res.statusCode).toBe(400);
        expect(res.body.messages).toContain('"messages" must be an array');
    });

    it('should return 401 for unauthenticated request', async () => {
        const conversationId = 8;

        const res = await request(app)
            .put(`/api/supabase/conversations/${conversationId}`)
            .send({ messages: [{ role: 'user', content: 'Hello' }] });

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe('Authentication token is missing');
    });

    it('should return 400 for empty messages array', async () => {
        const userId = 36;
        const conversationId = 8;
        const token = jwt.sign({ userId }, JWT_SECRET);

        const res = await request(app)
            .put(`/api/supabase/conversations/${conversationId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ messages: [] });

        expect(res.statusCode).toBe(400);
        expect(res.body.messages).toContain('"messages" must contain at least 1 items');
    });
});

describe('DELETE /api/supabase/conversations/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a conversation for authenticated user', async () => {
        const userId = 36;
        const conversationId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteConversationById.mockResolvedValue({ success: true });

        const res = await request(app)
            .delete(`/api/supabase/conversations/${conversationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Conversation deleted successfully');
        expect(supabase.deleteConversationById).toHaveBeenCalledWith(conversationId.toString(), userId);
    });

    it('should return 404 if conversation not found', async () => {
        const userId = 36;
        const conversationId = 999;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteConversationById.mockResolvedValue({ error: 'not_found' });

        const res = await request(app)
            .delete(`/api/supabase/conversations/${conversationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.message).toBe('Conversation not found');
    });

    it('should return 403 if user not authorized to delete conversation', async () => {
        const userId = 36;
        const conversationId = 2;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteConversationById.mockResolvedValue({ error: 'not_authorized' });

        const res = await request(app)
            .delete(`/api/supabase/conversations/${conversationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe('User not authorized to delete this conversation');
    });

    it('should return 401 for unauthenticated request', async () => {
        const conversationId = 1;

        const res = await request(app)
            .delete(`/api/supabase/conversations/${conversationId}`);

        expect(res.statusCode).toBe(401);
    });

    it('should return 500 for unexpected errors', async () => {
        const userId = 36;
        const conversationId = 1;
        const token = jwt.sign({ userId }, JWT_SECRET);

        supabase.deleteConversationById.mockRejectedValue(new Error('Unexpected error'));

        const res = await request(app)
            .delete(`/api/supabase/conversations/${conversationId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(500);
        expect(res.body.message).toBe('An error occurred while deleting the conversation');
    });
});
