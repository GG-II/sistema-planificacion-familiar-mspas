// ===== CONFIGURACIÓN DE LA API =====
const API_BASE_URL = 'http://localhost:5000/api';

// ===== GESTIÓN DE TOKENS =====
function getToken() {
    return localStorage.getItem('authToken');
}

function setToken(token) {
    localStorage.setItem('authToken', token);
}

function removeToken() {
    localStorage.removeItem('authToken');
}

function getRefreshToken() {
    return localStorage.getItem('refreshToken');
}

function setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
}

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
    removeToken();
    localStorage.removeItem('refreshToken');
}

function isLoggedIn() {
    return getCurrentUser() !== null && getToken() !== null;
}

// ===== FUNCIONES DE API =====
async function apiRequest(url, options = {}) {
    const token = getToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
        
        const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);
        
        // Intentar parsear JSON
        let data;
        try {
            data = await response.json();
        } catch (e) {
            data = { success: false, message: 'Respuesta inválida del servidor' };
        }

        if (!response.ok) {
            // Si es error 401, intentar refrescar token
            if (response.status === 401 && token) {
                const refreshed = await refreshAuthToken();
                if (refreshed) {
                    // Reintentar la petición original con nuevo token
                    finalOptions.headers['Authorization'] = `Bearer ${getToken()}`;
                    const retryResponse = await fetch(`${API_BASE_URL}${url}`, finalOptions);
                    return await retryResponse.json();
                } else {
                    // No se pudo refrescar, logout
                    logout();
                    throw new Error('Sesión expirada');
                }
            }
            
            throw new Error(data.message || `Error ${response.status}`);
        }

        console.log(`✅ API Response: ${url}`, data);
        return data;

    } catch (error) {
        console.error(`❌ API Error: ${url}`, error);
        throw error;
    }
}

// ===== AUTENTICACIÓN =====
async function loginUser(email, password) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success) {
            setToken(response.data.token);
            setRefreshToken(response.data.refreshToken);
            setCurrentUser(response.data.user);
            
            console.log('✅ Login exitoso:', response.data.user.nombres);
            return response.data.user;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        throw error;
    }
}

async function refreshAuthToken() {
    try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) return false;

        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        const data = await response.json();
        
        if (data.success) {
            setToken(data.data.token);
            setRefreshToken(data.data.refreshToken);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Error al refrescar token:', error);
        return false;
    }
}

async function logoutUser() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.warn('Error al hacer logout en servidor:', error);
    } finally {
        clearCurrentUser();
    }
}

// ===== FUNCIONES DE DATOS =====
async function getEstadisticas(año, mes) {
    try {
        const params = new URLSearchParams();
        if (año) params.append('año', año);
        if (mes) params.append('mes', mes);
        
        const response = await apiRequest(`/registros/estadisticas?${params}`);
        return response.data;
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        throw error;
    }
}

async function getRegistros(filters = {}) {
    try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });
        
        const response = await apiRequest(`/registros?${params}`);
        return response.data;
    } catch (error) {
        console.error('❌ Error al obtener registros:', error);
        throw error;
    }
}

async function createRegistro(registroData) {
    try {
        const response = await apiRequest('/registros', {
            method: 'POST',
            body: JSON.stringify(registroData)
        });
        
        if (response.success) {
            console.log('✅ Registro creado:', response.data.registro);
            return response.data.registro;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('❌ Error al crear registro:', error);
        throw error;
    }
}

async function updateRegistro(id, registroData) {
    try {
        const response = await apiRequest(`/registros/${id}`, {
            method: 'PUT',
            body: JSON.stringify(registroData)
        });
        
        if (response.success) {
            return response.data.registro;
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('❌ Error al actualizar registro:', error);
        throw error;
    }
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
    logoutUser().then(() => {
        showNotification('Sesión cerrada correctamente', 'info');
        setTimeout(() => {
            goToLogin();
        }, 1000);
    });
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
    
    console.log('🔗 Sistema conectado al backend:', API_BASE_URL);
});

// ===== FUNCIONES DE TESTING =====
async function testConnection() {
    try {
        const response = await fetch('http://localhost:5000/health');
        const data = await response.json();
        console.log('✅ Conexión al backend exitosa:', data);
        showNotification('Conexión al backend exitosa', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión al backend:', error);
        showNotification('Error de conexión al backend', 'error');
        return false;
    }
}

// ===== FUNCIONES DE COMPATIBILIDAD =====

// Función para simular carga de datos (compatibilidad con dashboard.js anterior)
async function simularCargaDatos() {
    try {
        console.log('🔄 Cargando datos reales del backend...');
        
        const [estadisticas, registros] = await Promise.all([
            getEstadisticas(new Date().getFullYear()),
            getRegistros({ limit: 10 })
        ]);
        
        return {
            ...estadisticas,
            registrosRecientes: registros.registros || []
        };
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        throw error;
    }
}

// Datos de comunidades (temporal hasta que se agreguen al backend)
const DEMO_DATA = {
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
            mensaje: 'Algunas comunidades están por debajo del 25% esperado',
            fecha: new Date().toISOString(),
            prioridad: 'alta'
        },
        {
            tipo: 'info',
            titulo: 'Registros pendientes',
            mensaje: 'Hay registros pendientes de validación',
            fecha: new Date().toISOString(),
            prioridad: 'media'
        }
    ]
};

// Función para obtener estadísticas actualizadas (compatibilidad)
function obtenerEstadisticasActualizadas() {
    return simularCargaDatos();
}

// Función de sincronización simulada
async function simularSincronizacion() {
    showNotification('Sincronizando con el servidor...', 'info');
    
    return new Promise((resolve) => {
        setTimeout(() => {
            showNotification('Datos sincronizados correctamente', 'success');
            resolve(true);
        }, 2000);
    });
}

// ===== FUNCIÓN PARA LIMPIAR DATOS =====
function limpiarEstadisticas(stats) {
    return {
        total_usuarias: parseInt(stats.total_usuarias) || 0,
        meta_anual: parseInt(stats.meta_anual) || 2100,
        porcentaje_cumplimiento: parseFloat(stats.porcentaje_cumplimiento) || 0,
        total_registros: parseInt(stats.total_registros) || 0,
        por_estado: stats.por_estado || {
            pendiente: 0,
            validado: 0,
            aprobado: 0
        },
        registrosRecientes: stats.registrosRecientes || []
    };
}

// Actualizar la función simularCargaDatos
async function simularCargaDatos() {
    try {
        console.log('🔄 Cargando datos reales del backend...');
        
        const [estadisticas, registros] = await Promise.all([
            getEstadisticas(new Date().getFullYear()),
            getRegistros({ limit: 10 })
        ]);
        
        const statsLimpios = limpiarEstadisticas({
            ...estadisticas,
            registrosRecientes: registros.registros || []
        });
        
        console.log('📊 Estadísticas procesadas:', statsLimpios);
        return statsLimpios;
        
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
        
        // Datos de fallback cuando hay error
        return limpiarEstadisticas({
            total_usuarias: 0,
            meta_anual: 2100,
            porcentaje_cumplimiento: 0,
            total_registros: 0,
            registrosRecientes: []
        });
    }
}

// Exportar función actualizada
window.simularCargaDatos = simularCargaDatos;
window.limpiarEstadisticas = limpiarEstadisticas;

// Exportar funciones adicionales
window.simularCargaDatos = simularCargaDatos;
window.obtenerEstadisticasActualizadas = obtenerEstadisticasActualizadas;
window.simularSincronizacion = simularSincronizacion;
window.DEMO_DATA = DEMO_DATA;

// Exportar funciones para uso global
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.clearCurrentUser = clearCurrentUser;
window.isLoggedIn = isLoggedIn;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.logout = logout;
window.goToLogin = goToLogin;
window.goToDashboard = goToDashboard;
window.goToRegistro = goToRegistro;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.getCurrentDate = getCurrentDate;
window.animateNumber = animateNumber;
window.calcularTotalUsuarias = calcularTotalUsuarias;
window.contarMetodosUtilizados = contarMetodosUtilizados;
window.getEstadisticas = getEstadisticas;
window.getRegistros = getRegistros;
window.createRegistro = createRegistro;
window.updateRegistro = updateRegistro;
window.testConnection = testConnection;