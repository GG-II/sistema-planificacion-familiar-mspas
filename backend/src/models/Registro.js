const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Registro = sequelize.define('Registro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  comunidad_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  comunidad_nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fecha_registro: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  año: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  
  // Métodos de planificación familiar
  iny_mensual: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  iny_bimensual: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  iny_trimestral: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  pildoras: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  pildora_emergencia: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  diu: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  implante: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  condon_masculino: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  condon_femenino: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  mela: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  collar: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  aqv_femenina: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  aqv_masculina: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0 }
  },
  
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  estado: {
    type: DataTypes.ENUM,
    values: ['pendiente', 'validado', 'aprobado', 'rechazado'],
    defaultValue: 'pendiente'
  },
  
  // Relación con usuario
  registrado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  
  validado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  
  fecha_validacion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  observaciones_validacion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'registros',
  indexes: [
    {
      fields: ['comunidad_id', 'año', 'mes']
    },
    {
      fields: ['fecha_registro']
    },
    {
      fields: ['estado']
    },
    {
      fields: ['registrado_por']
    }
  ]
});

// Hook para calcular año y mes automáticamente 
Registro.beforeValidate((registro) => {
  if (registro.fecha_registro) {
    const fecha = new Date(registro.fecha_registro);
    registro.año = fecha.getFullYear();
    registro.mes = fecha.getMonth() + 1;
    console.log(`📅 Calculando fecha: ${registro.fecha_registro} → Año: ${registro.año}, Mes: ${registro.mes}`);
  }
});

module.exports = Registro;