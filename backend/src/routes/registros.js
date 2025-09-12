const express = require('express');
const router = express.Router();
const registroController = require('../controllers/registroController');
const { authenticateToken, requireRole, requireCommunityAccess } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting para creación de registros (máximo 10 por hora)
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: {
    success: false,
    message: 'Demasiados registros creados. Intenta de nuevo en 1 hora.'
  }
});

/**
 * @route GET /api/registros
 * @desc Obtener registros con filtros
 * @access Private
 * @query {number} page - Página (default: 1)
 * @query {number} limit - Límite por página (default: 20)
 * @query {string} comunidad_id - Filtrar por comunidad
 * @query {number} año - Filtrar por año
 * @query {number} mes - Filtrar por mes
 * @query {string} estado - Filtrar por estado (pendiente, validado, aprobado, rechazado)
 * @query {string} fecha_inicio - Filtrar desde fecha (YYYY-MM-DD)
 * @query {string} fecha_fin - Filtrar hasta fecha (YYYY-MM-DD)
 */
router.get('/', authenticateToken, registroController.getRegistros);

/**
 * @route POST /api/registros
 * @desc Crear nuevo registro
 * @access Private - Auxiliar, Asistente, Encargado, Coordinador, Admin
 */
router.post('/', 
  createLimiter,
  authenticateToken, 
  requireRole(['auxiliar_enfermeria', 'asistente_tecnico', 'encargado_sr', 'coordinador_municipal', 'admin']),
  registroController.createRegistro
);

/**
 * @route GET /api/registros/estadisticas
 * @desc Obtener estadísticas generales
 * @access Private
 * @query {number} año - Año para estadísticas (default: año actual)
 * @query {number} mes - Mes específico (opcional)
 */
router.get('/estadisticas', authenticateToken, registroController.getEstadisticas);

/**
 * @route GET /api/registros/:id
 * @desc Obtener registro por ID
 * @access Private
 */
router.get('/:id', authenticateToken, registroController.getRegistroById);

/**
 * @route PUT /api/registros/:id
 * @desc Actualizar registro
 * @access Private - Solo el creador (si está pendiente) o supervisores
 */
router.put('/:id', 
  authenticateToken, 
  registroController.updateRegistro
);

/**
 * @route PUT /api/registros/:id/validate
 * @desc Validar/Aprobar/Rechazar registro
 * @access Private - Asistente, Encargado, Coordinador, Admin
 */
router.put('/:id/validate', 
  authenticateToken, 
  requireRole(['asistente_tecnico', 'encargado_sr', 'coordinador_municipal', 'admin']),
  registroController.validateRegistro
);

/**
 * @route DELETE /api/registros/:id
 * @desc Eliminar registro (solo si está pendiente y es el creador)
 * @access Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { Registro } = require('../models');
    const { id } = req.params;

    const registro = await Registro.findByPk(id);
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    // Solo el creador puede eliminar si está pendiente, o admin
    const puedeEliminar = (
      registro.registrado_por === req.user.id && registro.estado === 'pendiente'
    ) || req.user.rol === 'admin';

    if (!puedeEliminar) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este registro'
      });
    }

    await registro.destroy();

    res.json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });

    console.log(`✅ Registro eliminado: ID ${id} por ${req.user.email}`);

  } catch (error) {
    console.error('Error al eliminar registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;