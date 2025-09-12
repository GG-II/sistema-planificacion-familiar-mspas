const User = require('./User');
const Registro = require('./Registro');

// Definir relaciones
User.hasMany(Registro, { foreignKey: 'registrado_por', as: 'registros_creados' });
User.hasMany(Registro, { foreignKey: 'validado_por', as: 'registros_validados' });
Registro.belongsTo(User, { foreignKey: 'registrado_por', as: 'usuario_registro' });
Registro.belongsTo(User, { foreignKey: 'validado_por', as: 'usuario_validacion' });

const seedDatabase = async () => {
  try {
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('ℹ️ Base de datos ya tiene datos, omitiendo seed');
      return;
    }

    console.log('🌱 Creando datos de ejemplo...');

    const usuarios = [
      {
        email: 'admin@mspas.gob.gt',
        password: '123456',
        nombres: 'Maria',
        apellidos: 'González Pérez',
        rol: 'coordinador_municipal',
        cargo: 'Coordinadora Municipal',
        telefono: '50234567890',
        comunidades_asignadas: ['todas']
      },
      {
        email: 'aux01@mspas.gob.gt',
        password: '123456',
        nombres: 'Ana',
        apellidos: 'López Morales',
        rol: 'auxiliar_enfermeria',
        cargo: 'Auxiliar de Enfermería',
        telefono: '50298765432',
        comunidades_asignadas: ['san-pedro-necta', 'todos-santos']
      }
    ];

    for (const userData of usuarios) {
      await User.create(userData);
    }

    console.log('✅ Datos creados correctamente');
    console.log('👥 admin@mspas.gob.gt / 123456');
    console.log('👥 aux01@mspas.gob.gt / 123456');

  } catch (error) {
    console.error('❌ Error al crear datos:', error);
    throw error;
  }
};

module.exports = {
  User,
  Registro,
  seedDatabase
};