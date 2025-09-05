// ===== DATOS SIMULADOS GLOBALES =====
const DEMO_DATA = {
    usuarios: {
        'admin@mspas.gob.gt': { 
            password: '123456', 
            nombre: 'Dr. María González', 
            rol: 'Coordinadora Municipal',
            avatar: '👩‍⚕️',
            comunidades: ['todas'] // Acceso a todas las comunidades
        },
        'aux01@mspas.gob.gt': { 
            password: '123456', 
            nombre: 'Ana López', 
            rol: 'Auxiliar de Enfermería',
            avatar: '👩‍🔬',
            comunidades: ['san-pedro-necta', 'todos-santos'] // Acceso limitado
        }
    },
    
    estadisticas: {
        totalUsuarias: 1847,
        metaAnual: 2100,
        porcentajeCumplimiento: 87.9,
        alertasActivas: 3
    },
    
    registrosRecientes: [
        { 
            id: 1,
            comunidad: 'San Pedro Necta', 
            fecha: '2025-09-04',
            iny_trimestral: 15,
            diu: 2,
            pildoras: 8,
            estado: 'validado',
            registradoPor: 'Ana López'
        },
        { 
            id: 2,
            comunidad: 'Todos Santos', 
            fecha: '2025-09-03',
            implante: 3,
            iny_mensual: 6,
            condon_masculino: 25,
            estado: 'pendiente',
            registradoPor: 'Carlos Morales'
        },
        { 
            id: 3,
            comunidad: 'Santa Bárbara', 
            fecha: '2025-09-03',
            iny_bimensual: 8,
            pildoras: 12,
            mela: 4,
            estado: 'aprobado',
            registradoPor: 'María Santos'
        },
        { 
            id: 4,
            comunidad: 'La Democracia', 
            fecha: '2025-09-02',
            iny_trimestral: 12,
            diu: 1,
            collar: 3,
            estado: 'validado',
            registradoPor: 'Ana López'
        }
    ],
    
    comunidades: [
        { id: 'san-pedro-necta', nombre: 'San Pedro Necta', territorio: 'Norte', poblacion_mef: 245 },
        { id: 'todos-santos', nombre: 'Todos Santos Cuchumatán', territorio: 'Norte', poblacion_mef: 189 },
        { id: 'santa-barbara', nombre: 'Santa Bárbara', territorio: 'Sur', poblacion_mef: 156 },
        { id: 'la-democracia', nombre: 'La Democracia', territorio: 'Este', poblacion_mef: 203 },
        { id: 'san-juan-atitan', nombre: 'San Juan Atitán', territorio: 'Norte', poblacion_mef: 178 },
        { id: 'colotenango', nombre: 'Colotenango', territorio: 'Sur', poblacion_mef: 234 },
        { id: 'san-gaspar-ixchil', nombre: 'San Gaspar Ixchil', territorio: 'Este', poblacion_mef: 167 },
        { id: 'santa-eulalia', nombre: 'Santa Eulalia', territorio: 'Norte', poblacion_mef: 198 }
    ],
    
    alertas: [
        {
            tipo: 'warning',
            titulo: 'Meta trimestral baja',
            mensaje: 'San Pedro Necta solo ha alcanzado el 18% de su meta trimestral',
            fecha: '2025-09-05',
            prioridad: 'alta'
        },
        {
            tipo: 'info',
            titulo: 'Registro pendiente',
            mensaje: 'Todos Santos tiene registros pendientes de validación',
            fecha: '2025-09-04',
            prioridad: 'media'
        },
        {
            tipo: 'success',
            titulo: 'Meta superada',
            mensaje: 'Santa Bárbara superó su meta mensual en 105%',
            fecha: '2025-09-03',
            prioridad: 'baja'
        }
    ]
};

// ===== GESTIÓN DE SESIÓN =====
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

// ===== NAVEGACIÓN =====
function goToLogin() {
    window.location.href = 'login.html';
}

function goToDashboard() {
    window.location.href = 'dashboard.html';
}

function goToRegistro() {
    window.location.href = 'registro.html';
}

function logout() {
    clearCurrentUser();
    showNotification('Sesión cerrada correctamente', 'info');
    setTimeout(() => {
        goToLogin();
    }, 1000);
}

// ===== SISTEMA DE NOTIFICACIONES =====
function showNotification(message, type = 'info', duration = 4000) {
    // Remover notificaciones existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 350px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInNotification 0.3s ease;
        cursor: pointer;
    `;
    
    notification.innerHTML = `
        <span style="font-size: 18px;">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    // Agregar estilos de animación si no existen
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideInNotification {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutNotification {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification:hover {
                transform: scale(1.02);
                transition: transform 0.2s ease;
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Cerrar al hacer clic
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOutNotification 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Auto-cerrar
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, duration);
}

// ===== UTILIDADES =====
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        timeZone: 'America/Guatemala'
    };
    return new Date(dateString).toLocaleDateString('es-GT', options);
}

function formatDateTime(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Guatemala'
    };
    return new Date(dateString).toLocaleDateString('es-GT', options);
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function animateNumber(element, targetNumber, duration = 1000) {
    const start = 0;
    const increment = targetNumber / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= targetNumber) {
            current = targetNumber;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// ===== GESTIÓN DE DATOS LOCALES =====
function getRegistrosGuardados() {
    const registros = localStorage.getItem('registrosDemo');
    return registros ? JSON.parse(registros) : [];
}

function guardarRegistro(registro) {
    const registros = getRegistrosGuardados();
    registro.id = Date.now(); // ID único
    registro.fechaCreacion = new Date().toISOString();
    registro.registradoPor = getCurrentUser()?.nombre || 'Usuario Demo';
    registro.estado = 'pendiente';
    
    registros.push(registro);
    localStorage.setItem('registrosDemo', JSON.stringify(registros));
    return registro;
}

function actualizarRegistro(id, datosActualizados) {
    const registros = getRegistrosGuardados();
    const index = registros.findIndex(r => r.id === id);
    
    if (index !== -1) {
        registros[index] = { ...registros[index], ...datosActualizados };
        localStorage.setItem('registrosDemo', JSON.stringify(registros));
        return registros[index];
    }
    return null;
}

function eliminarRegistro(id) {
    const registros = getRegistrosGuardados();
    const registrosFiltrados = registros.filter(r => r.id !== id);
    localStorage.setItem('registrosDemo', JSON.stringify(registrosFiltrados));
}

// ===== CÁLCULOS Y ESTADÍSTICAS =====
function calcularTotalUsuarias(registro) {
    const campos = [
        'iny_mensual', 'iny_bimensual', 'iny_trimestral',
        'pildoras', 'pildora_emergencia',
        'diu', 'implante',
        'condon_masculino', 'condon_femenino',
        'mela', 'collar',
        'aqv_femenina', 'aqv_masculina'
    ];
    
    return campos.reduce((total, campo) => {
        return total + (parseInt(registro[campo]) || 0);
    }, 0);
}

function contarMetodosUtilizados(registro) {
    const campos = [
        'iny_mensual', 'iny_bimensual', 'iny_trimestral',
        'pildoras', 'pildora_emergencia',
        'diu', 'implante',
        'condon_masculino', 'condon_femenino',
        'mela', 'collar',
        'aqv_femenina', 'aqv_masculina'
    ];
    
    return campos.filter(campo => (parseInt(registro[campo]) || 0) > 0).length;
}

function obtenerEstadisticasActualizadas() {
    const registrosGuardados = getRegistrosGuardados();
    const registrosRecientes = DEMO_DATA.registrosRecientes;
    
    // Combinar registros demo con registros guardados
    const todosLosRegistros = [...registrosRecientes, ...registrosGuardados];
    
    const totalUsuarias = todosLosRegistros.reduce((total, registro) => {
        return total + calcularTotalUsuarias(registro);
    }, DEMO_DATA.estadisticas.totalUsuarias);
    
    const porcentajeCumplimiento = Math.min(
        (totalUsuarias / DEMO_DATA.estadisticas.metaAnual) * 100, 
        100
    );
    
    return {
        totalUsuarias,
        metaAnual: DEMO_DATA.estadisticas.metaAnual,
        porcentajeCumplimiento: Math.round(porcentajeCumplimiento * 10) / 10,
        alertasActivas: DEMO_DATA.estadisticas.alertasActivas,
        registrosRecientes: todosLosRegistros.slice(-10) // Últimos 10
    };
}

// ===== PROTECCIÓN DE RUTAS =====
function verificarSesion() {
    if (!isLoggedIn()) {
        showNotification('Debes iniciar sesión para acceder', 'warning');
        setTimeout(() => {
            goToLogin();
        }, 1500);
        return false;
    }
    return true;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en una página que requiere autenticación
    const paginasProtegidas = ['dashboard.html', 'registro.html'];
    const paginaActual = window.location.pathname.split('/').pop();
    
    if (paginasProtegidas.includes(paginaActual)) {
        if (!verificarSesion()) {
            return;
        }
    }
    
    // Si estamos en login y ya hay sesión, redirigir al dashboard
    if (paginaActual === 'login.html' && isLoggedIn()) {
        goToDashboard();
    }
});

// ===== FUNCIONES DE SIMULACIÓN =====
function simularCargaDatos() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(obtenerEstadisticasActualizadas());
        }, Math.random() * 1000 + 500); // Entre 500ms y 1.5s
    });
}

function simularSincronizacion() {
    showNotification('Sincronizando con el servidor...', 'info');
    
    return new Promise((resolve) => {
        setTimeout(() => {
            showNotification('Datos sincronizados correctamente', 'success');
            resolve(true);
        }, 2000);
    });
}

// Exportar funciones para uso global
window.DEMO_DATA = DEMO_DATA;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.clearCurrentUser = clearCurrentUser;
window.isLoggedIn = isLoggedIn;
window.goToLogin = goToLogin;
window.goToDashboard = goToDashboard;
window.goToRegistro = goToRegistro;
window.logout = logout;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.getCurrentDate = getCurrentDate;
window.animateNumber = animateNumber;
window.guardarRegistro = guardarRegistro;
window.getRegistrosGuardados = getRegistrosGuardados;
window.calcularTotalUsuarias = calcularTotalUsuarias;
window.contarMetodosUtilizados = contarMetodosUtilizados;
window.obtenerEstadisticasActualizadas = obtenerEstadisticasActualizadas;
window.simularCargaDatos = simularCargaDatos;
window.simularSincronizacion = simularSincronizacion;
    