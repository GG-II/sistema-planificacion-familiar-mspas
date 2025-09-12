const { User } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const Joi = require('joi');

// Esquemas de validación
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Debe ser un email válido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  })
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  nombres: Joi.string().min(2).max(100).required(),
  apellidos: Joi.string().min(2).max(100).required(),
  rol: Joi.string().valid('auxiliar_enfermeria', 'asistente_tecnico', 'encargado_sr', 'coordinador_municipal', 'admin').default('auxiliar_enfermeria'),
  cargo: Joi.string().optional(),
  telefono: Joi.string().min(8).max(20).optional(),
  comunidades_asignadas: Joi.array().items(Joi.string()).optional()
});

// Login de usuario
const login = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { email, password } = value;

    // Buscar usuario por email
    const user = await User.findOne({ 
      where: { 
        email: email.toLowerCase(),
        activo: true 
      } 
    });

    if (!user) {
      // Simular delay para evitar ataques de timing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Verificar si está bloqueado
    if (user.bloqueado) {
      return res.status(423).json({
        success: false,
        message: 'Usuario bloqueado. Contacta al administrador.'
      });
    }

    // Validar contraseña
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      // Incrementar intentos fallidos
      user.intentos_fallidos += 1;
      
      // Bloquear después de 5 intentos
      if (user.intentos_fallidos >= 5) {
        user.bloqueado = true;
      }
      
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
        intentos_restantes: Math.max(0, 5 - user.intentos_fallidos)
      });
    }

    // Login exitoso - resetear intentos fallidos
    user.intentos_fallidos = 0;
    user.ultimo_acceso = new Date();
    await user.save();

    // Generar tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: user.toSafeObject(),
        token,
        refreshToken,
        expiresIn: '24h'
      }
    });

    console.log(`✅ Login exitoso: ${user.email}`);

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registro de usuario (solo admin)
const register = async (req, res) => {
  try {
    // Validar que el usuario actual sea admin
    if (req.user.rol !== 'admin' && req.user.rol !== 'coordinador_municipal') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear usuarios'
      });
    }

    // Validar datos de entrada
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Verificar que el email no exista
    const existingUser = await User.findOne({ 
      where: { email: value.email.toLowerCase() } 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese email'
      });
    }

    // Crear usuario
    const newUser = await User.create({
      ...value,
      email: value.email.toLowerCase()
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: newUser.toSafeObject()
      }
    });

    console.log(`✅ Usuario creado: ${newUser.email} por ${req.user.email}`);

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario actual
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject()
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const changePasswordSchema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    });

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    const { currentPassword, newPassword } = value;

    // Verificar contraseña actual
    const isValidPassword = await req.user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    req.user.password = newPassword;
    await req.user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

    console.log(`✅ Contraseña cambiada: ${req.user.email}`);

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Refrescar token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'sgpf_refresh_secret');

    if (decoded.type !== 'refresh') {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido'
      });
    }

    // Generar nuevo token
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(403).json({
        success: false,
        message: 'Refresh token inválido o expirado'
      });
    }

    console.error('Error al refrescar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Logout (invalidar tokens)
const logout = async (req, res) => {
  try {
    // En una implementación real, aquí añadirías el token a una blacklist
    // Por simplicidad, solo respondemos exitosamente
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });

    console.log(`✅ Logout: ${req.user.email}`);

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  changePassword,
  refreshToken,
  logout
};