/**
 * STT Route — Offline Speech-to-Text via local Whisper.cpp
 * 
 * Accepts audio from frontend (MediaRecorder blob),
 * forwards to Whisper.cpp server, returns transcript.
 * 
 * 100% private — no audio leaves the device.
 * 
 * Endpoint: POST /api/ld/stt
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const FormData = require('form-data');
const { requireAuth } = require('../../middleware/auth');

// Store uploaded audio in memory (short clips only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const WHISPER_URL = process.env.WHISPER_BASE_URL || 'http://127.0.0.1:8082';

/**
 * POST /api/ld/stt
 * Accepts audio file, returns transcript text
 * 
 * Body: multipart/form-data with 'audio' field
 * Response: { success: true, transcript: "..." }
 */
router.post('/', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Forward to Whisper.cpp server
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: 'audio.wav',
      contentType: req.file.mimetype || 'audio/wav',
    });
    formData.append('temperature', '0.0');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    const response = await fetch(`${WHISPER_URL}/inference`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Whisper server error: ${response.status}`);
    }

    const result = await response.json();

    // Whisper returns { text: "..." }
    res.json({
      success: true,
      transcript: result.text?.trim() || '',
    });
  } catch (error) {
    console.error('[STT] Error:', error.message);

    // Fallback message
    res.status(503).json({
      success: false,
      error: 'Speech recognition unavailable. Please type your answer.',
    });
  }
});

module.exports = router;
