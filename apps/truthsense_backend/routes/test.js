const express = require('express');
const router = express.Router();

// Test endpoint to check if AI service integration is working
router.get('/ai-integration', async (req, res) => {
    try {
        const aiProcessingService = require('../services/aiProcessingService');
        
        // Create a mock recording object for testing
        const fs = require('fs');
        const path = require('path');
        
        // Create a test audio file if it doesn't exist
        const testDir = path.join(process.cwd(), 'media', 'test');
        const testFile = path.join(testDir, 'test.wav');
        
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        
        if (!fs.existsSync(testFile)) {
            // Create a minimal WAV file header for testing
            const wavHeader = Buffer.from([
                0x52, 0x49, 0x46, 0x46, // "RIFF"
                0x24, 0x00, 0x00, 0x00, // File size
                0x57, 0x41, 0x56, 0x45, // "WAVE"
                0x66, 0x6D, 0x74, 0x20, // "fmt "
                0x10, 0x00, 0x00, 0x00, // Subchunk size
                0x01, 0x00, 0x01, 0x00, // Audio format (1) and channels (1)
                0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
                0x88, 0x58, 0x01, 0x00, // Byte rate
                0x02, 0x00, 0x10, 0x00, // Block align and bits per sample
                0x64, 0x61, 0x74, 0x61, // "data"
                0x00, 0x00, 0x00, 0x00  // Data size
            ]);
            fs.writeFileSync(testFile, wavHeader);
        }
        
        const mockRecording = {
            id: 'test-recording-id',
            domain: 'test',
            audioFileName: 'test.wav',
            audioFilePath: testFile,
            postureFeatures: {
                eyeContact: { percentage: 0.8, score: 80 },
                shoulderAlignment: { score: 75, deviation: 5 },
                handGestures: { frequency: 0.5, appropriateness: 0.7 },
                headBodyAlignment: { score: 85, stability: 0.9 }
            },
            mimeType: 'audio/wav'
        };
        
        console.log('🧪 Testing AI service integration...');
        
        // Test the AI service call (this will likely fail if service isn't running)
        try {
            const result = await aiProcessingService.callAIService(mockRecording);
            
            res.json({
                success: true,
                message: 'AI service integration working',
                hasInfoFields: result && result.info ? true : false,
                result: result
            });
        } catch (aiError) {
            res.json({
                success: false,
                message: 'AI service not available - this explains why you\'re not getting info fields',
                error: aiError.message,
                note: 'The backend is probably falling back to cached/mock data'
            });
        }
        
    } catch (error) {
        console.error('❌ Test endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Test endpoint to check environment variables
router.get('/config', (req, res) => {
    res.json({
        AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'Not set',
        NODE_ENV: process.env.NODE_ENV || 'Not set',
        hasFormData: !!require.resolve('form-data'),
        hasNodeFetch: !!require.resolve('node-fetch')
    });
});

module.exports = router;