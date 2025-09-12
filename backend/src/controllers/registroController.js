const { Registro, User } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');

// Esquema de validación para registro
const registroSchema = Joi.object({
  comunidad_id: Joi.string().required(),
  comunidad_nombre: Joi.string().required(),
  fecha_registro: Joi.date().max('now').required(),
  
  // Métodos de planificación
  iny_mensual: Joi.number().integer().min(0).default(0),
  iny_bimensual: Joi.number().integer().min(0).default(0),
  iny_trimestral: Joi.number().integer().min(0).default(0),
  pildoras: Joi.number().integer().min(0).default(0),
  pildora_emergencia: Joi.number().integer().min(0).default(0),
  diu: Joi.number().integer().min(0).default(0),
  implante: Joi.number().integer().min(0).default(0),
  condon_masculino: Joi.number().integer().min(0).default(0),
  condon_femenino: Joi.number().integer().min(0).default(0),
  mela: Joi.number().integer().min(0).default(0),
  collar: Joi.number().integer().min(0).default(0),
  aqv_femenina: Joi.number().integer().min(0).default(0),
  aqv_masculina: Joi.number().integer().min(0).default(0),
  
  observaciones: Joi.string().max(1000).optional().allow('')
});

// Crear nuevo registro
const createRegistro = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error, value } = registroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Verificar que el usuario tenga acceso a la comunidad
    if (!req.user.puedeAccederComunidad(value.comunidad_id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta comunidad'
      });
    }

    // Calcular año y mes
    const fecha = new Date(value.fecha_registro);
    const año = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;

    // Verificar que no exista un registro duplicado
    const existingRegistro = await Registro.findOne({
      where: {
        comunidad_id: value.comunidad_id,
        año,
        mes,
        registrado_por: req.user.id
      }
    });

    if (existingRegistro) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro para ${value.comunidad_nombre} en ${mes}/${año}`,
        data: {
          registro_existente: existingRegistro
        }
      });
    }

    // Validar que al menos un método tenga datos
    const totalUsuarias = Object.keys(value)
      .filter(key => key.startsWith('iny_') || ['pildoras', 'pildora_emergencia', 'diu', 'implante', 'condon_masculino', 'condon_femenino', 'mela', 'collar', 'aqv_femenina', 'aqv_masculina'].includes(key))
      .reduce((total, key) => total + (value[key] || 0), 0);

    if (totalUsuarias === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar al menos una usuaria en algún método'
      });
    }

    // Crear registro
    const nuevoRegistro = await Registro.create({
      ...value,
      registrado_por: req.user.id
    });

    // Obtener registro completo con relaciones
    const registroCompleto = await Registro.findByPk(nuevoRegistro.id, {
      include: [
        {
          model: User,
          as: 'usuario_registro',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Registro creado exitosamente',
      data: {
        registro: registroCompleto
      }
    });

    console.log(`✅ Registro creado: ${value.comunidad_nombre} (${totalUsuarias} usuarias) por ${req.user.email}`);

  } catch (error) {
    console.error('Error al crear registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener registros (con filtros)
const getRegistros = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      comunidad_id,
      año,
      mes,
      estado,
      fecha_inicio,
      fecha_fin
    } = req.query;

    // Construir filtros
    const where = {};
    
    // Filtro por comunidad (respetando permisos)
    if (comunidad_id) {
      if (!req.user.puedeAccederComunidad(comunidad_id)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta comunidad'
        });
      }
      where.comunidad_id = comunidad_id;
    } else {
      // Si no es admin, filtrar por comunidades asignadas
      if (req.user.rol !== 'admin' && req.user.rol !== 'coordinador_municipal') {
        where.comunidad_id = {
          [Op.in]: req.user.comunidades_asignadas
        };
      }
    }

    // Filtros temporales
    if (año) where.año = parseInt(año);
    if (mes) where.mes = parseInt(mes);
    if (estado) where.estado = estado;

    // Filtro por rango de fechas
    if (fecha_inicio || fecha_fin) {
      where.fecha_registro = {};
      if (fecha_inicio) where.fecha_registro[Op.gte] = fecha_inicio;
      if (fecha_fin) where.fecha_registro[Op.lte] = fecha_fin;
    }

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Consulta
    const { count, rows } = await Registro.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'usuario_registro',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol']
        },
        {
          model: User,
          as: 'usuario_validacion',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol'],
          required: false
        }
      ],
      order: [['fecha_registro', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        registros: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener registro por ID
const getRegistroById = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await Registro.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario_registro',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol']
        },
        {
          model: User,
          as: 'usuario_validacion',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol'],
          required: false
        }
      ]
    });

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    // Verificar permisos de acceso
    if (!req.user.puedeAccederComunidad(registro.comunidad_id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este registro'
      });
    }

    res.json({
      success: true,
      data: {
        registro
      }
    });

  } catch (error) {
    console.error('Error al obtener registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar registro
const updateRegistro = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar registro
    const registro = await Registro.findByPk(id);
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    // Verificar permisos
    const puedeEditar = (
      registro.registrado_por === req.user.id && registro.estado === 'pendiente'
    ) || (
      ['asistente_tecnico', 'encargado_sr', 'coordinador_municipal', 'admin'].includes(req.user.rol)
    );

    if (!puedeEditar) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para editar este registro'
      });
    }

    // Validar datos
    const { error, value } = registroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Actualizar registro
    await registro.update(value);

    // Obtener registro actualizado con relaciones
    const registroActualizado = await Registro.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario_registro',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol']
        },
        {
          model: User,
          as: 'usuario_validacion',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: {
        registro: registroActualizado
      }
    });

    console.log(`✅ Registro actualizado: ID ${id} por ${req.user.email}`);

  } catch (error) {
    console.error('Error al actualizar registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Validar/Aprobar registro
const validateRegistro = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, observaciones_validacion } = req.body;

    // Verificar permisos
    if (!['asistente_tecnico', 'encargado_sr', 'coordinador_municipal', 'admin'].includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para validar registros'
      });
    }

    // Validar estado
    if (!['validado', 'aprobado', 'rechazado'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    // Buscar registro
    const registro = await Registro.findByPk(id);
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado'
      });
    }

    // Actualizar estado
    await registro.update({
      estado,
      validado_por: req.user.id,
      fecha_validacion: new Date(),
      observaciones_validacion
    });

    // Obtener registro actualizado
    const registroActualizado = await Registro.findByPk(id, {
      include: [
        {
          model: User,
          as: 'usuario_registro',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol']
        },
        {
          model: User,
          as: 'usuario_validacion',
          attributes: ['id', 'nombres', 'apellidos', 'email', 'rol']
        }
      ]
    });

    res.json({
      success: true,
      message: `Registro ${estado} exitosamente`,
      data: {
        registro: registroActualizado
      }
    });

    console.log(`✅ Registro ${estado}: ID ${id} por ${req.user.email}`);

  } catch (error) {
    console.error('Error al validar registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas
const getEstadisticas = async (req, res) => {
  try {
    const { año = new Date().getFullYear(), mes } = req.query;

    // Construir filtros base
    const whereBase = { año: parseInt(año) };
    if (mes) whereBase.mes = parseInt(mes);

    // Filtrar por comunidades según permisos
    if (req.user.rol !== 'admin' && req.user.rol !== 'coordinador_municipal') {
      whereBase.comunidad_id = {
        [Op.in]: req.user.comunidades_asignadas
      };
    }

    // Obtener estadísticas generales
    const totalRegistros = await Registro.count({ where: whereBase });
    
    const registros = await Registro.findAll({
      where: whereBase,
      attributes: [
        'iny_mensual', 'iny_bimensual', 'iny_trimestral',
        'pildoras', 'pildora_emergencia', 'diu', 'implante',
        'condon_masculino', 'condon_femenino', 'mela', 'collar',
        'aqv_femenina', 'aqv_masculina'
      ]
    });

    // Calcular totales
    const totales = {
      total_usuarias: 0,
      por_metodo: {}
    };

    const metodos = [
      'iny_mensual', 'iny_bimensual', 'iny_trimestral',
      'pildoras', 'pildora_emergencia', 'diu', 'implante',
      'condon_masculino', 'condon_femenino', 'mela', 'collar',
      'aqv_femenina', 'aqv_masculina'
    ];

    metodos.forEach(metodo => {
      totales.por_metodo[metodo] = 0;
    });

    registros.forEach(registro => {
      metodos.forEach(metodo => {
        const valor = registro[metodo] || 0;
        totales.por_metodo[metodo] += valor;
        totales.total_usuarias += valor;
      });
    });

    // Estadísticas por estado
    const porEstado = await Registro.findAll({
      where: whereBase,
      attributes: [
        'estado',
        [Registro.sequelize.fn('COUNT', Registro.sequelize.col('id')), 'cantidad']
      ],
      group: ['estado'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        periodo: { año: parseInt(año), mes: mes ? parseInt(mes) : null },
        total_registros: totalRegistros,
        total_usuarias: totales.total_usuarias,
        por_metodo: totales.por_metodo,
        por_estado: porEstado.reduce((acc, item) => {
          acc[item.estado] = parseInt(item.cantidad);
          return acc;
        }, {}),
        meta_anual: 2100, // Esto vendría de configuración
        porcentaje_cumplimiento: Math.round((totales.total_usuarias / 2100) * 100 * 10) / 10
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  createRegistro,
  getRegistros,
  getRegistroById,
  updateRegistro,
  validateRegistro,
  getEstadisticas
};