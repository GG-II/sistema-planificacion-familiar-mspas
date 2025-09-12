// ===== LÓGICA DEL DASHBOARD CON API REAL =====

let currentStats = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📊 Dashboard cargado - Conectado al backend');
    
    // Verificar sesión
    if (!verificarSesion()) {
        return;
    }
    
    // Inicializar dashboard
    await initializeDashboard();
    
    // Configurar actualizaciones automáticas
    setupAutoRefresh();
});

async function initializeDashboard() {
    try {
        // Mostrar información del usuario
        displayUserInfo();
        
        // Cargar datos con animación
        showLoadingStates();
        
        // Cargar datos reales del backend
        console.log('📡 Cargando datos del backend...');
        
        const [estadisticas, registros] = await Promise.all([
            getEstadisticas(new Date().getFullYear()),
            getRegistros({ limit: 10 })
        ]);
        
        currentStats = {
            ...estadisticas,
            registrosRecientes: registros.registros || []
        };
        
        console.log('✅ Datos cargados del backend:', currentStats);
        
        // Actualizar todas las secciones
        updateStatsCards();
        updateActivityList();
        updateCommunitiesGrid();
        updateAlertsList();
        updateLastUpdate();
        
        // Simular gráfica
        drawChart();
        
        console.log('✅ Dashboard inicializado correctamente con datos reales');
        
    } catch (error) {
        console.error('❌ Error al inicializar dashboard:', error);
        
        let errorMessage = 'Error al cargar los datos del dashboard';
        if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Error de conexión con el servidor. Verifica que el backend esté funcionando.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'Sesión expirada. Redirigiendo al login...';
            setTimeout(() => logout(), 2000);
        }
        
        showNotification(errorMessage, 'error');
        
        // Cargar datos de fallback para que no se vea vacío
        loadFallbackData();
    }
}

function loadFallbackData() {
    console.log('⚠️ Cargando datos de fallback...');
    currentStats = {
        total_usuarias: 0,
        meta_anual: 2100,
        porcentaje_cumplimiento: 0,
        total_registros: 0,
        por_estado: {
            pendiente: 0,
            validado: 0,
            aprobado: 0
        },
        registrosRecientes: []
    };
    
    updateStatsCards();
    updateActivityList();
    updateLastUpdate();
    
    showNotification('Usando datos de respaldo. Verifica la conexión del backend.', 'warning');
}

function displayUserInfo() {
    const user = getCurrentUser();
    if (!user) {
        console.warn('⚠️ No hay información de usuario');
        logout();
        return;
    }
    
    const userNameElements = document.querySelectorAll('#user-name, .user-name');
    const userRoleElements = document.querySelectorAll('#user-role, .user-role');
    
    userNameElements.forEach(el => {
        el.textContent = `${user.nombres} ${user.apellidos}`;
    });
    
    userRoleElements.forEach(el => {
        const rolesMap = {
            'coordinador_municipal': 'Coordinador Municipal',
            'encargado_sr': 'Encargado de Salud Reproductiva',
            'asistente_tecnico': 'Asistente Técnico',
            'auxiliar_enfermeria': 'Auxiliar de Enfermería',
            'admin': 'Administrador'
        };
        el.textContent = rolesMap[user.rol] || user.rol;
    });
    
    console.log('👤 Usuario mostrado:', user.nombres, user.apellidos);
}

function showLoadingStates() {
    // Mostrar estados de carga en las tarjetas
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(el => {
        el.textContent = '...';
        el.style.opacity = '0.5';
    });
    
    // Mostrar loading en listas
    const activityList = document.getElementById('activity-list');
    if (activityList) {
        activityList.innerHTML = '<div style="text-align: center; padding: 20px; color: #7f8c8d;">Cargando actividades...</div>';
    }
}

function updateStatsCards() {
    if (!currentStats) return;
    
    // Animar números
    const totalElement = document.getElementById('total-usuarias');
    const cumplimientoElement = document.getElementById('cumplimiento');
    const metaElement = document.getElementById('meta-anual');
    const alertasElement = document.getElementById('alertas');
    
    if (totalElement) {
        totalElement.style.opacity = '1';
        animateNumber(totalElement, currentStats.total_usuarias || 0);
    }
    
    if (cumplimientoElement) {
        cumplimientoElement.style.opacity = '1';
        setTimeout(() => {
            cumplimientoElement.textContent = (currentStats.porcentaje_cumplimiento || 0) + '%';
        }, 500);
    }
    
    if (metaElement) {
        metaElement.style.opacity = '1';
        animateNumber(metaElement, currentStats.meta_anual || 2100);
    }
    
    if (alertasElement) {
        alertasElement.style.opacity = '1';
        const alertasCount = calculateAlertas();
        setTimeout(() => {
            alertasElement.textContent = alertasCount;
        }, 800);
    }
    
    console.log('📊 Estadísticas actualizadas:', {
        usuarias: currentStats.total_usuarias,
        cumplimiento: currentStats.porcentaje_cumplimiento,
        meta: currentStats.meta_anual
    });
}

function calculateAlertas() {
    if (!currentStats) return 0;
    
    let alertas = 0;
    
    // Alerta si el cumplimiento está por debajo del 25% trimestral
    const trimestre = Math.ceil(new Date().getMonth() / 3);
    const esperadoTrimestre = (currentStats.meta_anual || 0) * 0.25 * trimestre;
    if ((currentStats.total_usuarias || 0) < esperadoTrimestre * 0.8) {
        alertas++;
    }
    
    // Alerta por registros pendientes
    if (currentStats.por_estado && currentStats.por_estado.pendiente > 0) {
        alertas++;
    }
    
    return alertas;
}

function updateActivityList() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    if (!currentStats || !currentStats.registrosRecientes || currentStats.registrosRecientes.length === 0) {
        activityList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                <h4>No hay registros recientes</h4>
                <p>Los registros aparecerán aquí cuando se ingresen datos</p>
            </div>
        `;
        return;
    }
    
    const registros = currentStats.registrosRecientes.slice(0, 5); // Últimos 5
    
    activityList.innerHTML = registros.map(registro => {
        const totalUsuarias = calcularTotalUsuarias(registro);
        const iconClass = registro.estado === 'aprobado' ? 'success' : 
                         registro.estado === 'pendiente' ? 'warning' : 'info';
        const iconText = registro.estado === 'aprobado' ? '✓' : 
                        registro.estado === 'pendiente' ? '⏳' : 'ℹ';
        
        const nombreUsuario = registro.usuario_registro 
            ? `${registro.usuario_registro.nombres} ${registro.usuario_registro.apellidos}`
            : 'Usuario desconocido';
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">${iconText}</div>
                <div class="activity-content">
                    <div class="activity-title">${registro.comunidad_nombre || 'Comunidad desconocida'}</div>
                    <div class="activity-subtitle">
                        ${totalUsuarias} usuarias • ${formatDate(registro.fecha_registro)} • ${registro.estado}
                    </div>
                    <div class="activity-user">Por: ${nombreUsuario}</div>
                </div>
                <div class="activity-actions">
                    <button class="btn-small" onclick="verDetalleRegistro(${registro.id})">
                        Ver
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    console.log('📋 Lista de actividad actualizada:', registros.length, 'registros');
}

function updateCommunitiesGrid() {
    const communitiesGrid = document.getElementById('communities-grid');
    if (!communitiesGrid) return;
    
    // Datos simulados de comunidades (en futuro podrían venir del backend)
    const comunidades = [
        { id: 'san-pedro-necta', nombre: 'San Pedro Necta', territorio: 'Norte', poblacion_mef: 245 },
        { id: 'todos-santos', nombre: 'Todos Santos', territorio: 'Norte', poblacion_mef: 189 },
        { id: 'santa-barbara', nombre: 'Santa Bárbara', territorio: 'Sur', poblacion_mef: 156 },
        { id: 'la-democracia', nombre: 'La Democracia', territorio: 'Este', poblacion_mef: 203 }
    ];
    
    communitiesGrid.innerHTML = comunidades.map(comunidad => {
        // Calcular estadísticas para esta comunidad basado en registros reales
        const registrosComunidad = currentStats.registrosRecientes ? 
            currentStats.registrosRecientes.filter(r => 
                r.comunidad_id === comunidad.id || 
                (r.comunidad_nombre && r.comunidad_nombre.toLowerCase().includes(comunidad.nombre.toLowerCase().split(' ')[0]))
            ) : [];
        
        const totalAtendidas = registrosComunidad.reduce((total, registro) => {
            return total + calcularTotalUsuarias(registro);
        }, 0);
        
        const porcentaje = comunidad.poblacion_mef > 0 ? 
            Math.round((totalAtendidas / comunidad.poblacion_mef) * 100) : 0;
        const statusClass = porcentaje >= 80 ? 'success' : porcentaje >= 50 ? 'warning' : 'danger';
        
        return `
            <div class="community-card ${statusClass}">
                <div class="community-header">
                    <h4>${comunidad.nombre}</h4>
                    <span class="territory-badge">${comunidad.territorio}</span>
                </div>
                <div class="community-stats">
                    <div class="stat-item">
                        <span class="stat-label">MEF:</span>
                        <span class="stat-value">${comunidad.poblacion_mef}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Atendidas:</span>
                        <span class="stat-value">${totalAtendidas}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Cobertura:</span>
                        <span class="stat-value">${porcentaje}%</span>
                    </div>
                </div>
                <div class="community-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${statusClass}" style="width: ${Math.min(porcentaje, 100)}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateAlertsList() {
    const alertsList = document.getElementById('alerts-list');
    if (!alertsList) return;
    
    const alertas = [];
    
    // Generar alertas basadas en datos reales
    if (currentStats) {
        const cumplimiento = currentStats.porcentaje_cumplimiento || 0;
        
        if (cumplimiento < 25) {
            alertas.push({
                tipo: 'warning',
                titulo: 'Meta trimestral baja',
                mensaje: `Solo se ha alcanzado el ${cumplimiento.toFixed(1)}% de la meta anual`,
                fecha: new Date().toISOString()
            });
        }
        
        if (currentStats.por_estado && currentStats.por_estado.pendiente > 0) {
            alertas.push({
                tipo: 'info',
                titulo: 'Registros pendientes',
                mensaje: `Hay ${currentStats.por_estado.pendiente} registros pendientes de validación`,
                fecha: new Date().toISOString()
            });
        }
        
        if (cumplimiento > 100) {
            alertas.push({
                tipo: 'success',
                titulo: 'Meta superada',
                mensaje: `¡Excelente! Se ha superado la meta anual en ${(cumplimiento - 100).toFixed(1)}%`,
                fecha: new Date().toISOString()
            });
        }
    }
    
    if (alertas.length === 0) {
        alertsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                <div style="font-size: 32px; margin-bottom: 10px;">✅</div>
                <p>No hay alertas pendientes</p>
            </div>
        `;
        return;
    }
    
    const iconMap = {
        warning: '⚠️',
        info: 'ℹ️',
        success: '✅',
        error: '❌'
    };
    
    alertsList.innerHTML = alertas.map(alerta => `
        <div class="alert-item ${alerta.tipo}">
            <div class="alert-icon">${iconMap[alerta.tipo]}</div>
            <div class="alert-content">
                <div class="alert-title">${alerta.titulo}</div>
                <div class="alert-message">${alerta.mensaje}</div>
                <div class="alert-date">${formatDate(alerta.fecha)}</div>
            </div>
            <div class="alert-actions">
                <button class="btn-small" onclick="dismissAlert('${alerta.titulo}')">
                    Descartar
                </button>
            </div>
        </div>
    `).join('');
    
    // Actualizar contador de alertas
    const alertCount = document.getElementById('alert-count');
    if (alertCount) {
        alertCount.textContent = `${alertas.length} pendientes`;
    }
}

function updateLastUpdate() {
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = formatDateTime(new Date().toISOString());
    }
}

function drawChart() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Datos de ejemplo basados en stats reales
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];
    const metaAnual = currentStats ? currentStats.meta_anual : 2100;
    const metaMensual = Math.round(metaAnual / 12);
    
    // Simular progreso acumulativo
    const data = [];
    const meta = [];
    for (let i = 0; i < months.length; i++) {
        const variacion = Math.random() * 0.3 + 0.85; // Entre 85% y 115% de la meta
        data.push(Math.round(metaMensual * (i + 1) * variacion));
        meta.push(metaMensual * (i + 1));
    }
    
    // Configuración del gráfico
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);
    const maxValue = Math.max(...data, ...meta) * 1.1;
    
    // Función para convertir datos a coordenadas
    function dataToCoords(index, value) {
        const x = padding + (index / (months.length - 1)) * chartWidth;
        const y = padding + (1 - value / maxValue) * chartHeight;
        return { x, y };
    }
    
    // Dibujar grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Líneas horizontales
    for (let i = 0; i <= 5; i++) {
        const y = padding + (i / 5) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Líneas verticales
    for (let i = 0; i < months.length; i++) {
        const coords = dataToCoords(i, 0);
        ctx.beginPath();
        ctx.moveTo(coords.x, padding);
        ctx.lineTo(coords.x, height - padding);
        ctx.stroke();
    }
    
    // Dibujar línea de meta
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    for (let i = 0; i < meta.length; i++) {
        const coords = dataToCoords(i, meta[i]);
        if (i === 0) {
            ctx.moveTo(coords.x, coords.y);
        } else {
            ctx.lineTo(coords.x, coords.y);
        }
    }
    ctx.stroke();
    
    // Dibujar línea de datos reales
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const coords = dataToCoords(i, data[i]);
        if (i === 0) {
            ctx.moveTo(coords.x, coords.y);
        } else {
            ctx.lineTo(coords.x, coords.y);
        }
    }
    ctx.stroke();
    
    // Dibujar puntos
    ctx.fillStyle = '#667eea';
    for (let i = 0; i < data.length; i++) {
        const coords = dataToCoords(i, data[i]);
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Dibujar etiquetas de meses
    ctx.fillStyle = '#7f8c8d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i < months.length; i++) {
        const coords = dataToCoords(i, 0);
        ctx.fillText(months[i], coords.x, height - padding + 20);
    }
    
    // Leyenda
    ctx.textAlign = 'left';
    ctx.fillStyle = '#667eea';
    ctx.fillText('● Usuarias atendidas', padding, 25);
    ctx.fillStyle = '#f39c12';
    ctx.fillText('-- Meta acumulada', padding + 150, 25);
}

function setupAutoRefresh() {
    // Actualizar cada 5 minutos
    setInterval(async () => {
        console.log('🔄 Actualizando datos automáticamente...');
        try {
            const [estadisticas, registros] = await Promise.all([
                getEstadisticas(new Date().getFullYear()),
                getRegistros({ limit: 10 })
            ]);
            
            currentStats = {
                ...estadisticas,
                registrosRecientes: registros.registros || []
            };
            
            updateStatsCards();
            updateActivityList();
            updateLastUpdate();
            
            console.log('✅ Datos actualizados automáticamente');
        } catch (error) {
            console.warn('⚠️ Error en actualización automática:', error);
        }
    }, 300000); // 5 minutos
}

// ===== FUNCIONES DE INTERACCIÓN =====

async function refreshData() {
    showNotification('Actualizando datos...', 'info');
    
    try {
        showLoadingStates();
        
        const [estadisticas, registros] = await Promise.all([
            getEstadisticas(new Date().getFullYear()),
            getRegistros({ limit: 10 })
        ]);
        
        currentStats = {
            ...estadisticas,
            registrosRecientes: registros.registros || []
        };
        
        updateStatsCards();
        updateActivityList();
        updateCommunitiesGrid();
        updateAlertsList();
        updateLastUpdate();
        drawChart();
        
        showNotification('Datos actualizados correctamente', 'success');
        
    } catch (error) {
        showNotification('Error al actualizar los datos', 'error');
        console.error('Error:', error);
    }
}

function verDetalleRegistro(registroId) {
    if (!registroId || registroId === 'demo') {
        showNotification('Función de detalle en desarrollo', 'info');
        return;
    }
    
    showNotification(`Ver detalle del registro #${registroId}`, 'info');
    // Aquí podrías abrir un modal o navegar a una página de detalle
}

function dismissAlert(alertTitle) {
    showNotification(`Alerta "${alertTitle}" descartada`, 'success');
    
    // Remover alerta de la lista
    const alertElement = event.target.closest('.alert-item');
    if (alertElement) {
        alertElement.style.animation = 'slideOutNotification 0.3s ease';
        setTimeout(() => {
            alertElement.remove();
            
            // Actualizar contador
            const alertCount = document.getElementById('alert-count');
            if (alertCount) {
                const currentCount = parseInt(alertCount.textContent.match(/\d+/)[0]);
                alertCount.textContent = `${Math.max(0, currentCount - 1)} pendientes`;
            }
        }, 300);
    }
}

// ===== ATAJOS DE TECLADO =====
document.addEventListener('keydown', function(e) {
    // F5 = Actualizar datos
    if (e.key === 'F5') {
        e.preventDefault();
        refreshData();
    }
    
    // Ctrl + N = Nuevo registro
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        goToRegistro();
    }
    
    // Ctrl + L = Logout
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        logout();
    }
});

// Exportar funciones para uso en HTML
window.refreshData = refreshData;
window.verDetalleRegistro = verDetalleRegistro;
window.dismissAlert = dismissAlert;

console.log('📊 Dashboard.js cargado con API real - Atajos: F5 (Actualizar), Ctrl+N (Nuevo), Ctrl+L (Logout)');