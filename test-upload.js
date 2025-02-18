const { uploadPhoto } = require('./src/services/supabaseService');
const fs = require('fs');
const path = require('path');

async function testPhotoUpload() {
    try {
        const testImagePath = path.join(__dirname, 'cat.jpeg');
        const buffer = fs.readFileSync(testImagePath);
        console.log("buffer", buffer);
        console.log("typeof buffer", typeof buffer);

        const photo = {
            buffer: buffer,
            mimetype: 'image/jpeg',
            originalname: 'cat.jpeg'
        };

        console.log('Uploading photo...');
        const result = await uploadPhoto(photo);
        console.log('Upload successful!');
        console.log('Result:', result);
    } catch (error) {
        console.error('Upload failed:', error.message);
    }
}

testPhotoUpload(); 