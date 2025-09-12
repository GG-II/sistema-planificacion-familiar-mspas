require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Importar configuración y modelos
const { connectDB, closeDB } = require('./src/config/database');
const { seedDatabase } = require('./src/models');

// Importar rutas
const authRoutes = require('./src/routes/auth');
const registroRoutes = require('./src/routes/registros');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5500', // Live Server
    'http://localhost:5500'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors(corsOptions));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Crear directorio de base de datos si no existe
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('📁 Directorio de base de datos creado');
}

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Información de la API
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API del Sistema de Gestión de Planificación Familiar - MSPAS',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      registros: '/api/registros'
    },
    docs: '/api/docs',
    health: '/health'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/registros', registroRoutes);

// Ruta para servir documentación básica
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    documentation: {
      title: 'SGPF API Documentation',
      version: '1.0.0',
      description: 'API REST para el Sistema de Gestión de Planificación Familiar',
      endpoints: {
        auth: {
          'POST /api/auth/login': 'Iniciar sesión',
          'POST /api/auth/register': 'Registrar usuario (admin)',
          'GET /api/auth/profile': 'Obtener perfil',
          'PUT /api/auth/change-password': 'Cambiar contraseña',
          'POST /api/auth/refresh-token': 'Refrescar token',
          'POST /api/auth/logout': 'Cerrar sesión'
        },
        registros: {
          'GET /api/registros': 'Obtener registros (con filtros)',
          'POST /api/registros': 'Crear registro',
          'GET /api/registros/estadisticas': 'Obtener estadísticas',
          'GET /api/registros/:id': 'Obtener registro por ID',
          'PUT /api/registros/:id': 'Actualizar registro',
          'PUT /api/registros/:id/validate': 'Validar registro',
          'DELETE /api/registros/:id': 'Eliminar registro'
        }
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>'
      },
      status_codes: {
        200: 'Éxito',
        201: 'Creado',
        400: 'Datos inválidos',
        401: 'No autorizado',
        403: 'Prohibido',
        404: 'No encontrado',
        409: 'Conflicto',
        429: 'Demasiadas peticiones',
        500: 'Error del servidor'
      }
    }
  });
});

// Middleware de manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    suggestion: 'Revisa la documentación en /api/docs'
  });
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { 
      error: error.message,
      stack: error.stack 
    })
  });
});

// Función para inicializar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor SGPF...');
    
    // Conectar a la base de datos
    await connectDB();
    
    // Crear datos de ejemplo si no existen
    await seedDatabase();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('🎉 ¡Servidor iniciado exitosamente!');
      console.log('');
      console.log(`📍 URL del servidor: http://localhost:${PORT}`);
      console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
      console.log(`💚 Estado de salud: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📋 Endpoints disponibles:');
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/registros`);
      console.log(`   POST http://localhost:${PORT}/api/registros`);
      console.log('');
      console.log('👥 Usuarios de prueba:');
      console.log('   📧 admin@mspas.gob.gt / 🔑 123456 (Coordinadora)');
      console.log('   📧 aux01@mspas.gob.gt / 🔑 123456 (Auxiliar)');
      console.log('');
      console.log('🔧 Modo:', process.env.NODE_ENV || 'development');
      console.log('⏰ Hora de inicio:', new Date().toLocaleString('es-GT'));
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de cierre
process.on('SIGINT', async () => {
  console.log('\n⏹️ Cerrando servidor...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Cerrando servidor...');
  await closeDB();
  process.exit(0);
});

// Iniciar servidor
startServer();