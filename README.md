# 🏥 Sistema de Gestión de Planificación Familiar - MSPAS

**Centro de Salud Norte - Huehuetenango, Guatemala**

## 📋 Descripción del Proyecto

Sistema integral para el registro, seguimiento y análisis de métodos de planificación familiar en 45 comunidades del distrito de salud de Huehuetenango. Desarrollado como proyecto universitario para modernizar los procesos actuales basados en Excel.

## 🎯 Problemática que Resuelve

- **Proceso Manual Ineficiente**: Elimina el registro manual en Excel y consolidación tardía
- **Falta de Sincronización**: Implementa sincronización en tiempo real entre dispositivos
- **Ausencia de Alertas**: Genera alertas automáticas de cumplimiento trimestral
- **Reportes Manuales**: Automatiza la generación de reportes para SIGSA 3

## ✨ Características Principales

### 🌟 Demo Web (Versión Actual)
- ✅ **Autenticación Segura**: Login con roles diferenciados
- ✅ **Dashboard Interactivo**: Métricas en tiempo real y KPIs
- ✅ **Diseño Responsive**: Adaptable a móviles y tablets
- ✅ **Datos Simulados**: Información realista del MSPAS
- ✅ **Interfaz Intuitiva**: Diseño Material Design

### 🚀 Funcionalidades Planificadas (3 semanas)
- 📱 **App Android Nativa**: Funcionamiento offline completo
- 🔄 **Sincronización Automática**: Base de datos PostgreSQL
- 📊 **Reportes Avanzados**: Exportación Excel/PDF
- 👥 **Control de Usuarios**: 4 niveles jerárquicos
- 🔔 **Sistema de Alertas**: Notificaciones push
- 📈 **Analytics**: Tendencias y proyecciones

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Android   │    │   Web Dashboard │    │   API REST      │
│   (Kotlin)      │◄──►│   (React/Vue)   │◄──►│   (Node.js)     │
│   SQLite Local  │    │   Responsive    │    │   Express       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │  PostgreSQL DB  │
                                               │  + Backups      │
                                               └─────────────────┘
```

## 👥 Usuarios del Sistema

| Rol | Permisos | Función Principal |
|-----|----------|-------------------|
| **Auxiliar de Enfermería** | Registrar datos | Ingreso mensual por comunidad |
| **Asistente Técnico** | Registrar + Validar | Supervisión territorial |
| **Encargado Salud Reproductiva** | Validar + Aprobar + Reportes | Coordinación distrital |
| **Coordinador Municipal** | Solo reportes ejecutivos | Toma de decisiones |

## 📊 Métodos de Planificación Familiar

- 💉 Inyecciones (Mensual, Bimensual, Trimestral)
- 💊 Píldoras Anticonceptivas
- 🔧 DIU (Dispositivo Intrauterino)
- 💉 Implantes Subdérmicos
- 🛡️ Preservativos
- 📿 Collar del Ciclo
- 🤱 MELA (Lactancia)
- ⚕️ Anticoncepción Quirúrgica (AQV)

## 🚀 Demo en Vivo

**Acceso al Demo Web:**
1. Abrir `demo-web/index.html` en cualquier navegador
2. Credenciales: `admin@mspas.gob.gt` / `123456`
3. Explorar dashboard interactivo

## 📁 Estructura del Proyecto

```
sistema-planificacion-familiar-mspas/
├── 📁 demo-web/              # Demo funcional actual
│   ├── index.html            # Página principal
│   ├── css/styles.css        # Estilos profesionales
│   ├── js/app.js            # Lógica de la aplicación
│   └── assets/              # Imágenes y recursos
├── 📁 backend/              # API REST (Semana 1)
├── 📁 android/              # App móvil (Semana 2)
├── 📁 docs/                 # Documentación técnica
└── 📁 deployment/           # Scripts de despliegue
```

## 💰 Costos de Implementación

| Opción | Costo Anual | Características |
|--------|-------------|-----------------|
| **Desarrollo** | $0 | Hosting gratuito para demo |
| **Producción Básica** | $60 | Railway.app + PostgreSQL |
| **Producción Robusta** | $83 | VPS dedicado + dominio .gt |
| **Gubernamental** | $0 | Oracle Cloud Free Tier |

## 🎯 Impacto Esperado

- 📉 **70% reducción** en tiempo de consolidación
- 📊 **95% eliminación** de errores de transcripción  
- ⚡ **<1 minuto** para generar reportes
- 📈 **+15% mejora** en cumplimiento de metas
- 👥 **100 usuarios** capacitados en 45 comunidades

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5, CSS3, JavaScript** (Demo actual)
- **Kotlin + Jetpack Compose** (App Android)
- **Material Design 3** (UI/UX)

### Backend
- **Node.js + Express** (API REST)
- **PostgreSQL** (Base de datos principal)
- **SQLite** (Almacenamiento local Android)

### DevOps
- **GitHub** (Control de versiones)
- **GitHub Actions** (CI/CD)
- **Docker** (Containerización)

## 📈 Cronograma de Desarrollo

| Semana | Enfoque | Entregables |
|--------|---------|-------------|
| **1** | Backend + BD | API REST + PostgreSQL |
| **2** | App Android | Pantallas + Sincronización |
| **3** | Integración | Reportes + Despliegue |

## 👨‍💻 Información del Desarrollador

- **Estudiante**: [Tu Nombre]
- **Universidad**: Universidad de San Carlos de Guatemala
- **Carrera**: Ingeniería en Sistemas
- **Proyecto**: Trabajo de graduación
- **Fecha**: Septiembre 2025

## 📞 Contacto y Soporte

- 📧 **Email**: [tu-email@usac.edu.gt]
- 📱 **WhatsApp**: [tu-numero]
- 💼 **LinkedIn**: [tu-perfil]
- 🐙 **GitHub**: [tu-usuario]

## 📄 Licencia

Este proyecto es desarrollado con fines académicos y está destinado para uso del Ministerio de Salud Pública y Asistencia Social (MSPAS) de Guatemala.

---

**🏥 "Mejorando la salud reproductiva a través de la tecnología"**

*Proyecto desarrollado con 💙 para las comunidades de Huehuetenango*