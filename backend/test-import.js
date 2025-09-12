const { connectDB, closeDB } = require('./src/config/database');

console.log('connectDB:', typeof connectDB);
console.log('closeDB:', typeof closeDB);

if (typeof connectDB === 'function') {
  console.log('✅ connectDB se importa correctamente');
} else {
  console.log('❌ connectDB no es una función');
}