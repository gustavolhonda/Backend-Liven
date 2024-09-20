
const express = require('express');
const router = express.Router();

const TranscriptionController = require('../controllers/transcriptionController');
const upload = require('../config/multer');

const firebaseAuthController = require('../controllers/firebase-auth-controller');
const verifyToken = require('../middleware/verifyToken');

// Rotas públicas
router.post('/api/register', firebaseAuthController.registerUser);
router.post('/api/login', firebaseAuthController.loginUser);
router.post('/api/logout', firebaseAuthController.logoutUser);
router.post('/api/reset-password', firebaseAuthController.resetPassword);

// Rotas protegidas
router.get('/api/user', verifyToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

router.get('/api/protected', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Acesso concedido à rota protegida', user: req.user });
});

// Rotas para transcrição que também são protegidas
router.post('/api/transcriptions', verifyToken, upload.single('file'), TranscriptionController.createTranscription);
router.get('/api/transcriptions', verifyToken, TranscriptionController.getTranscriptions);
router.get('/api/transcriptions/:id/download', verifyToken, TranscriptionController.downloadTranscription);
router.get('/transcriptions/daily-limit', verifyToken, TranscriptionController.getDailyLimit);

module.exports = router;
