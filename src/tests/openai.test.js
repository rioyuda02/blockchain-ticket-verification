const request = require('supertest');
const { createServer } = require('http');
const app = require('../server');
const supabaseService = require('../services/supabaseService');
const openaiService = require('../services/openaiService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

jest.mock('../services/supabaseService');
jest.mock('../services/openaiService');

const server = createServer(app);

describe('POST /api/openai/chat', () => {
    const mockUserId = 36;
    const mockCatId = 1;
    const mockMessages = [{ role: 'user', content: 'Hello' }];
    const mockCatDetails = { name: 'Whiskers', age: 2 };

    beforeEach(() => {
        jest.clearAllMocks();
        supabaseService.getCatDetails.mockReset();
        openaiService.sendMessagesToOpenAI.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 200 and response from OpenAI on success', async () => {
        const token = jwt.sign({ id: mockUserId }, JWT_SECRET);
        supabaseService.getCatDetails.mockResolvedValue(mockCatDetails);
        openaiService.sendMessagesToOpenAI.mockResolvedValue('OpenAI response');

        const response = await request(server)
            .post('/api/openai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ catId: mockCatId, messages: mockMessages });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('OpenAI response');
        expect(supabaseService.getCatDetails).toHaveBeenCalledWith(mockCatId);
        expect(openaiService.sendMessagesToOpenAI).toHaveBeenCalledWith(mockCatDetails, mockMessages);
    });

    it('should return 401 if user is not authenticated', async () => {
        const response = await request(server)
            .post('/api/openai/chat')
            .send({ catId: mockCatId, messages: mockMessages });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication token is missing');
    });

    it('should return 400 if messages are not a non-empty array', async () => {
        const token = jwt.sign({ id: mockUserId }, JWT_SECRET);
        const response = await request(server)
            .post('/api/openai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ catId: mockCatId, messages: [] });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Messages must be a non-empty array');
    });

    it('should return 404 if cat is not found', async () => {
        const token = jwt.sign({ id: mockUserId }, JWT_SECRET);
        supabaseService.getCatDetails.mockRejectedValue({ code: 'PGRST116' });

        const response = await request(server)
            .post('/api/openai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ catId: mockCatId, messages: mockMessages });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Cat not found');
    });

    it('should return 500 if an error occurs', async () => {
        const token = jwt.sign({ id: mockUserId }, JWT_SECRET);
        supabaseService.getCatDetails.mockRejectedValue(new Error('Unexpected error'));

        const response = await request(server)
            .post('/api/openai/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ catId: mockCatId, messages: mockMessages });

        expect(response.status).toBe(500);
        expect(response.body.message).toBe('An error occurred while processing the request');
    });

    it('should return 401 if token is invalid', async () => {
        const response = await request(server)
            .post('/api/openai/chat')
            .set('Authorization', 'Bearer invalid-token')
            .send({ catId: mockCatId, messages: mockMessages });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Invalid token. User not authenticated.');
    });
});

beforeAll((done) => {
    server.listen(0, () => {
        done();
    });
});

afterAll((done) => {
    server.close(() => {
        done();
    });
});
