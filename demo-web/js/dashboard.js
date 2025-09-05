// ===== LÓGICA DEL DASHBOARD =====

let currentStats = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('📊 Dashboard cargado');
    
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
        
        // Simular carga de datos
        currentStats = await simularCargaDatos();
        
        // Actualizar todas las secciones
        updateStatsCards();
        updateActivityList();
        updateCommunitiesGrid();
        updateAlertsList();
        updateLastUpdate();
        
        // Simular gráfica
        drawChart();
        
        console.log('✅ Dashboard inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar dashboard:', error);
        showNotification('Error al cargar los datos del dashboard', 'error');
    }
}

function displayUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userNameElements = document.querySelectorAll('#user-name, .user-name');
    const userRoleElements = document.querySelectorAll('#user-role, .user-role');
    
    userNameElements.forEach(el => el.textContent = user.nombre);
    userRoleElements.forEach(el => el.textContent = user.rol);
}

function showLoadingStates() {
    // Mostrar estados de carga en las tarjetas
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(el => {
        el.textContent = '...';
        el.style.opacity = '0.5';
    });
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
        animateNumber(totalElement, currentStats.totalUsuarias);
    }
    
    if (cumplimientoElement) {
        cumplimientoElement.style.opacity = '1';
        setTimeout(() => {
            cumplimientoElement.textContent = currentStats.porcentajeCumplimiento + '%';
        }, 500);
    }
    
    if (metaElement) {
        metaElement.style.opacity = '1';
        animateNumber(metaElement, currentStats.metaAnual);
    }
    
    if (alertasElement) {
        alertasElement.style.opacity = '1';
        setTimeout(() => {
            alertasElement.textContent = currentStats.alertasActivas;
        }, 800);
    }
}

function updateActivityList() {
    const activityList = document.getElementById('activity-list');
    if (!activityList || !currentStats) return;
    
    const registros = currentStats.registrosRecientes.slice(0, 5); // Últimos 5
    
    activityList.innerHTML = registros.map(registro => {
        const totalUsuarias = calcularTotalUsuarias(registro);
        const iconClass = registro.estado === 'aprobado' ? 'success' : 
                         registro.estado === 'pendiente' ? 'warning' : 'info';
        const iconText = registro.estado === 'aprobado' ? '✓' : 
                        registro.estado === 'pendiente' ? '⏳' : 'ℹ';
        
        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">${iconText}</div>
                <div class="activity-content">
                    <div class="activity-title">${registro.comunidad || 'Comunidad'}</div>
                    <div class="activity-subtitle">
                        ${totalUsuarias} usuarias • ${formatDate(registro.fecha)} • ${registro.estado}
                    </div>
                    <div class="activity-user">Por: ${registro.registradoPor}</div>
                </div>
                <div class="activity-actions">
                    <button class="btn-small" onclick="verDetalleRegistro(${registro.id})">
                        Ver
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateCommunitiesGrid() {
    const communitiesGrid = document.getElementById('communities-grid');
    if (!communitiesGrid) return;
    
    communitiesGrid.innerHTML = DEMO_DATA.comunidades.map(comunidad => {
        // Calcular estadísticas para esta comunidad
        const registrosComunidad = currentStats.registrosRecientes.filter(
            r => r.comunidad && r.comunidad.toLowerCase().includes(comunidad.nombre.toLowerCase().split(' ')[0])
        );
        
        const totalAtendidas = registrosComunidad.reduce((total, registro) => {
            return total + calcularTotalUsuarias(registro);
        }, 0);
        
        const porcentaje = Math.round((totalAtendidas / comunidad.poblacion_mef) * 100);
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
    
    alertsList.innerHTML = DEMO_DATA.alertas.map(alerta => {
        const iconMap = {
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅',
            error: '❌'
        };
        
        return `
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
        `;
    }).join('');
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
    
    // Datos de ejemplo para la gráfica
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];
    const data = [120, 135, 145, 158, 172, 165, 180, 195, 210];
    const meta = [150, 150, 150, 150, 150, 150, 150, 150, 150];
    
    // Configuración
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
    
    // Dibujar línea de datos
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
    ctx.fillText('-- Meta mensual', padding + 150, 25);
}

function setupAutoRefresh() {
    // Actualizar cada 30 segundos
    setInterval(async () => {
        console.log('🔄 Actualizando datos automáticamente...');
        currentStats = await simularCargaDatos();
        updateStatsCards();
        updateActivityList();
        updateLastUpdate();
    }, 30000);
}

// ===== FUNCIONES DE INTERACCIÓN =====

async function refreshData() {
    showNotification('Actualizando datos...', 'info');
    
    try {
        showLoadingStates();
        currentStats = await simularCargaDatos();
        
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
                alertCount.textContent = `${currentCount - 1} pendientes`;
            }
        }, 300);
    }
}

function filtrarPorTerritorio() {
    const filtro = document.getElementById('territory-filter').value;
    showNotification(`Filtrando por territorio: ${filtro}`, 'info');
    
    // Aquí implementarías la lógica de filtrado
    updateCommunitiesGrid();
}

function filtrarGrafica() {
    const filtro = document.getElementById('chart-filter').value;
    showNotification(`Filtrando gráfica por: ${filtro}`, 'info');
    
    // Redibujar gráfica con nuevos datos
    drawChart();
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
window.filtrarPorTerritorio = filtrarPorTerritorio;
window.filtrarGrafica = filtrarGrafica;

console.log('📊 Dashboard.js cargado - Atajos: F5 (Actualizar), Ctrl+N (Nuevo), Ctrl+L (Logout)');