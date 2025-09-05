// Datos simulados para el demo
const DEMO_DATA = {
    usuarios: {
        'admin@mspas.gob.gt': { password: '123456', nombre: 'Dr. María González', rol: 'Coordinadora Municipal' },
        'aux01@mspas.gob.gt': { password: '123456', nombre: 'Ana López', rol: 'Auxiliar de Enfermería' }
    },
    estadisticas: {
        totalUsuarias: 1847,
        metaAnual: 2100,
        porcentajeCumplimiento: 87.9,
        alertasActivas: 3
    },
    registrosRecientes: [
        { comunidad: 'San Pedro Necta', metodo: 'Inyección Trimestral', cantidad: 15, fecha: '2025-09-04', estado: 'validado' },
        { comunidad: 'Todos Santos', metodo: 'DIU', cantidad: 3, fecha: '2025-09-04', estado: 'pendiente' },
        { comunidad: 'Santa Bárbara', metodo: 'Implante', cantidad: 8, fecha: '2025-09-03', estado: 'aprobado' },
        { comunidad: 'La Democracia', metodo: 'Píldora', cantidad: 12, fecha: '2025-09-03', estado: 'validado' },
        { comunidad: 'San Juan Atitán', metodo: 'Inyección Mensual', cantidad: 6, fecha: '2025-09-02', estado: 'pendiente' }
    ]
};

// Estado de la aplicación
let currentUser = null;

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de Planificación Familiar - MSPAS iniciado');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Mostrar pantalla de login
    showScreen('login-screen');
});

// Configurar todos los event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button (se agregará cuando creemos el dashboard)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('logout-btn')) {
            handleLogout();
        }
    });
}

// Manejar el login
function handleLogin(event) {
    event.preventDefault();
    
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;
    
    console.log('🔐 Intentando login:', email);
    
    // Validar credenciales
    if (DEMO_DATA.usuarios[email] && DEMO_DATA.usuarios[email].password === password) {
        currentUser = {
            email: email,
            ...DEMO_DATA.usuarios[email]
        };
        
        console.log('✅ Login exitoso:', currentUser.nombre);
        
        // Crear y mostrar dashboard
        createDashboard();
        showScreen('dashboard-screen');
        
        // Mostrar mensaje de bienvenida
        showNotification(`¡Bienvenido, ${currentUser.nombre}!`, 'success');
        
    } else {
        console.log('❌ Login fallido');
        showNotification('Credenciales incorrectas. Intenta con: admin@mspas.gob.gt / 123456', 'error');
    }
}

// Manejar logout
function handleLogout() {
    console.log('👋 Cerrando sesión');
    currentUser = null;
    showScreen('login-screen');
    showNotification('Sesión cerrada correctamente', 'info');
}

// Mostrar una pantalla específica
function showScreen(screenId) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar la pantalla solicitada
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// Crear el dashboard dinámicamente
function createDashboard() {
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    dashboardScreen.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h1 class="dashboard-title">Dashboard - Planificación Familiar</h1>
                <p style="color: #7f8c8d; margin-top: 5px;">Centro de Salud Norte - Huehuetenango</p>
            </div>
            <div class="user-info">
                <div style="text-align: right;">
                    <div style="font-weight: 600; color: #2c3e50;">${currentUser.nombre}</div>
                    <div style="color: #7f8c8d; font-size: 14px;">${currentUser.rol}</div>
                </div>
                <button class="logout-btn">Cerrar Sesión</button>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number primary">${DEMO_DATA.estadisticas.totalUsuarias.toLocaleString()}</div>
                <div class="stat-label">Usuarias Atendidas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number success">${DEMO_DATA.estadisticas.porcentajeCumplimiento}%</div>
                <div class="stat-label">Cumplimiento Anual</div>
            </div>
            <div class="stat-card">
                <div class="stat-number warning">${DEMO_DATA.estadisticas.metaAnual.toLocaleString()}</div>
                <div class="stat-label">Meta Anual</div>
            </div>
            <div class="stat-card">
                <div class="stat-number danger">${DEMO_DATA.estadisticas.alertasActivas}</div>
                <div class="stat-label">Alertas Activas</div>
            </div>
        </div>

        <div class="main-content">
            <div class="chart-container">
                <h3 class="section-title">📊 Tendencias Mensuales</h3>
                <div class="chart-placeholder">
                    Gráfica de cumplimiento mensual<br>
                    <small>(Se implementará con Chart.js)</small>
                </div>
            </div>

            <div class="recent-activity">
                <h3 class="section-title">📋 Actividad Reciente</h3>
                <ul class="activity-list">
                    ${generateActivityList()}
                </ul>
            </div>
        </div>

        <div class="quick-actions">
            <a href="#" class="action-btn" onclick="showNotification('Función de registro en desarrollo', 'info')">
                📝 Registrar Datos
            </a>
            <a href="#" class="action-btn" onclick="showNotification('Función de reportes en desarrollo', 'info')">
                📊 Generar Reporte
            </a>
            <a href="#" class="action-btn" onclick="showNotification('Función de validación en desarrollo', 'info')">
                ✅ Validar Registros
            </a>
            <a href="#" class="action-btn" onclick="showNotification('Función de configuración en desarrollo', 'info')">
                ⚙️ Configuración
            </a>
        </div>
    `;
}

// Generar lista de actividad reciente
function generateActivityList() {
    return DEMO_DATA.registrosRecientes.map(registro => {
        const iconClass = registro.estado === 'aprobado' ? 'success' : 
                         registro.estado === 'pendiente' ? 'warning' : 'info';
        const iconText = registro.estado === 'aprobado' ? '✓' : 
                        registro.estado === 'pendiente' ? '⏳' : 'ℹ';
        
        return `
            <li class="activity-item">
                <div class="activity-icon ${iconClass}">${iconText}</div>
                <div class="activity-text">
                    <div class="activity-title">${registro.comunidad} - ${registro.metodo}</div>
                    <div class="activity-subtitle">${registro.cantidad} usuarias • ${formatDate(registro.fecha)} • ${registro.estado}</div>
                </div>
            </li>
        `;
    }).join('');
}

// Formatear fecha
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : 
                     type === 'error' ? '#e74c3c' : 
                     type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        max-width: 300px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    
    // Agregar estilos de animación
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Función para simular carga de datos (útil para demostrar)
function simulateDataLoad() {
    showNotification('Sincronizando datos...', 'info');
    
    setTimeout(() => {
        showNotification('Datos actualizados correctamente', 'success');
        // Aquí podrías actualizar las estadísticas
    }, 2000);
}

// Exportar funciones para uso en el HTML (si es necesario)
window.showNotification = showNotification;
window.simulateDataLoad = simulateDataLoad;