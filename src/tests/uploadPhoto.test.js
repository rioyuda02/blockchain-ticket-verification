const { uploadPhoto } = require('../services/supabaseService');
const { uploadPhotoToSupabase } = require('../services/supabaseConnection');

// Mock the supabaseConnection module
jest.mock('../services/supabaseConnection');

describe('uploadPhoto', () => {
    // Clear all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully upload a photo', async () => {
        // Mock photo data
        const mockPhoto = {
            buffer: Buffer.from('test-image'),
            mimetype: 'image/jpeg',
            originalname: 'test-cat.jpg'
        };

        // Mock successful response from Supabase
        const mockResponse = {
            path: 'cat-photos/test-cat.jpg',
            url: 'https://supabase.storage/cat-photos/test-cat.jpg'
        };

        // Setup the mock implementation
        uploadPhotoToSupabase.mockResolvedValue(mockResponse);

        // Test the upload function
        const result = await uploadPhoto(mockPhoto);

        // Verify the results
        expect(result).toEqual(mockResponse);
        expect(uploadPhotoToSupabase).toHaveBeenCalled();
        expect(uploadPhotoToSupabase).toHaveBeenCalledTimes(1);
    });

    it('should handle upload failure', async () => {
        // Mock photo data
        const mockPhoto = {
            buffer: Buffer.from('test-image'),
            mimetype: 'image/jpeg',
            originalname: 'test-cat.jpg'
        };

        // Mock error response
        const mockError = new Error('Upload failed');
        uploadPhotoToSupabase.mockRejectedValue(mockError);

        // Test error handling
        await expect(uploadPhoto(mockPhoto)).rejects.toThrow('Upload failed');
        expect(uploadPhotoToSupabase).toHaveBeenCalled();
        expect(uploadPhotoToSupabase).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid photo data', async () => {
        // Mock invalid photo data
        const mockInvalidPhoto = null;

        // Mock error response
        const mockError = new Error('Invalid photo data');
        uploadPhotoToSupabase.mockRejectedValue(mockError);

        // Test error handling for invalid data
        await expect(uploadPhoto(mockInvalidPhoto)).rejects.toThrow('Invalid photo data');
        expect(uploadPhotoToSupabase).not.toHaveBeenCalled();
    });
}); 