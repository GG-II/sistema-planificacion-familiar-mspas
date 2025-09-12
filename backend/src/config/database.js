const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database/sgpf.db'),
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de datos conectada');
    await sequelize.sync({ force: false });
    console.log('📊 Modelos sincronizados');
    return sequelize;
  } catch (error) {
    console.error('❌ Error de BD:', error);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('🔐 BD cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar:', error);
  }
};

module.exports = {
  sequelize,
  connectDB,
  closeDB
};