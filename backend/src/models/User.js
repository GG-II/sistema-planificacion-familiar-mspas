const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  nombres: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  rol: {
    type: DataTypes.ENUM,
    values: ['auxiliar_enfermeria', 'asistente_tecnico', 'encargado_sr', 'coordinador_municipal', 'admin'],
    allowNull: false,
    defaultValue: 'auxiliar_enfermeria'
  },
  cargo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [8, 20]
    }
  },
  comunidades_asignadas: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  intentos_fallidos: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  bloqueado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'usuarios',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['rol']
    },
    {
      fields: ['activo']
    }
  ]
});

// Hook para encriptar contraseña antes de guardar
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Método para validar contraseña
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método para obtener datos seguros (sin contraseña)
User.prototype.toSafeObject = function() {
  const { password, intentos_fallidos, ...safeUser } = this.toJSON();
  return safeUser;
};

// Método para verificar si el usuario puede acceder a una comunidad
User.prototype.puedeAccederComunidad = function(comunidadId) {
  if (this.rol === 'admin' || this.rol === 'coordinador_municipal') {
    return true; // Acceso total
  }
  
  if (!this.comunidades_asignadas || this.comunidades_asignadas.length === 0) {
    return false;
  }
  
  return this.comunidades_asignadas.includes(comunidadId) || 
         this.comunidades_asignadas.includes('todas');
};

module.exports = User;