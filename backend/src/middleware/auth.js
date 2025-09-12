const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sgpf_secret_key');
    
    // Buscar el usuario en la base de datos
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido o inactivo'
      });
    }

    // Agregar usuario a la request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en autenticación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

// Middleware para verificar acceso a comunidad específica
const requireCommunityAccess = (req, res, next) => {
  const comunidadId = req.params.comunidadId || req.body.comunidad_id;
  
  if (!comunidadId) {
    return res.status(400).json({
      success: false,
      message: 'ID de comunidad requerido'
    });
  }

  if (!req.user.puedeAccederComunidad(comunidadId)) {
    return res.status(403).json({
      success: false,
      message: 'No tienes acceso a esta comunidad'
    });
  }

  next();
};

// Función para generar JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'sgpf_secret_key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Función para generar refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' }, 
    process.env.JWT_REFRESH_SECRET || 'sgpf_refresh_secret',
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  requireCommunityAccess,
  generateToken,
  generateRefreshToken
};