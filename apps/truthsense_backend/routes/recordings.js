const express = require('express');
const recordingController = require('../controllers/recordingController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RecordingDomain:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           enum: [interview, speech, presentation, lecture, briefing, conference_talk, monologue]
 *         label:
 *           type: string
 *         isActive:
 *           type: boolean
 *     Recording:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         domain:
 *           type: string
 *           enum: [interview, speech, presentation, lecture, briefing, conference_talk, monologue]
 *         status:
 *           type: string
 *           enum: [idle, recording, completed, processing, processed, failed]
 *         duration:
 *           type: integer
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/recordings/domains:
 *   get:
 *     summary: Get available recording domains
 *     tags: [Recordings]
 *     responses:
 *       200:
 *         description: Recording domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 domains:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecordingDomain'
 */
router.get('/domains', recordingController.getRecordingDomains);

/**
 * @swagger
 * /api/recordings:
 *   post:
 *     summary: Create a new recording session
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - domain
 *             properties:
 *               domain:
 *                 type: string
 *                 enum: [interview, speech, presentation, lecture, briefing, conference_talk, monologue]
 *     responses:
 *       201:
 *         description: Recording session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recording:
 *                   $ref: '#/components/schemas/Recording'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken, recordingController.createRecording);

/**
 * @swagger
 * /api/recordings/{recordingId}/start:
 *   post:
 *     summary: Start recording
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recording started successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recording not found
 */
router.post('/:recordingId/start', authenticateToken, recordingController.startRecording);

/**
 * @swagger
 * /api/recordings/{recordingId}/stop:
 *   post:
 *     summary: Stop recording
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recording stopped successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recording not found
 */
router.post('/:recordingId/stop', authenticateToken, recordingController.stopRecording);

/**
 * @swagger
 * /api/recordings/{recordingId}/upload:
 *   post:
 *     summary: Upload audio file and posture features
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audioFile
 *               - postureFeatures
 *             properties:
 *               audioFile:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (wav, webm, mp3, m4a)
 *               postureFeatures:
 *                 type: string
 *                 description: JSON string containing posture analysis data
 *     responses:
 *       200:
 *         description: File uploaded successfully, processing started
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recording not found
 *       429:
 *         description: Upload limit exceeded
 */
router.post('/:recordingId/upload', 
  authenticateToken, 
  uploadLimiter, 
  upload.single('audioFile'), 
  handleUploadError, 
  recordingController.uploadRecording
);

/**
 * @swagger
 * /api/recordings/{recordingId}:
 *   get:
 *     summary: Get recording details and analysis results
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recording details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recordingId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum: [idle, recording, completed, processing, processed, failed]
 *                 analysis:
 *                   type: object
 *                   description: Analysis results (only when status is 'processed')
 *                 processedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Processing completion time (only when status is 'processed')
 *                 error:
 *                   type: string
 *                   description: Error message (only when status is 'failed')
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recording not found
 */
router.get('/:recordingId', authenticateToken, recordingController.getRecording);

/**
 * @swagger
 * /api/recordings:
 *   get:
 *     summary: Get user's recordings
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recordings to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of recordings to skip
 *     responses:
 *       200:
 *         description: Recordings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recordings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recording'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, recordingController.getUserRecordings);

/**
 * @swagger
 * /api/recordings/{recordingId}/retry:
 *   post:
 *     summary: Reset recording to retry
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recording reset successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recording not found
 */
router.post('/:recordingId/retry', authenticateToken, recordingController.retryRecording);

/**
 * @swagger
 * /api/recordings/{recordingId}:
 *   delete:
 *     summary: Delete recording
 *     tags: [Recordings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Recording deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Recording not found
 */
router.delete('/:recordingId', authenticateToken, recordingController.deleteRecording);

module.exports = router;