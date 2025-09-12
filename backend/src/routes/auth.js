const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting para login (máximo 5 intentos por 15 minutos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para registro (máximo 3 por hora)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: {
    success: false,
    message: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.'
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login de usuario
 * @access Public
 */
router.post('/login', loginLimiter, authController.login);

/**
 * @route POST /api/auth/register
 * @desc Registro de nuevo usuario (solo admin)
 * @access Private - Admin/Coordinador
 */
router.post('/register', 
  registerLimiter, 
  authenticateToken, 
  requireRole(['admin', 'coordinador_municipal']), 
  authController.register
);

/**
 * @route GET /api/auth/profile
 * @desc Obtener perfil del usuario actual
 * @access Private
 */
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route PUT /api/auth/change-password
 * @desc Cambiar contraseña del usuario actual
 * @access Private
 */
router.put('/change-password', authenticateToken, authController.changePassword);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refrescar token de acceso
 * @access Public
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Cerrar sesión
 * @access Private
 */
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;