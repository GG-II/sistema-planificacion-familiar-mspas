// ===== LÓGICA DEL REGISTRO CON API REAL =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Página de registro cargada - Conectado al backend');
    
    // Verificar sesión
    if (!verificarSesion()) {
        return;
    }
    
    // Inicializar página
    initializeRegistroPage();
    
    // Configurar event listeners
    setupRegistroListeners();
    
    // Cargar registros existentes del backend
    loadExistingRegistros();
});

function initializeRegistroPage() {
    // Mostrar información del usuario
    displayUserInfo();
    
    // Configurar fecha actual
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = getCurrentDate();
    }
    
    // Filtrar comunidades según permisos del usuario
    filterCommunitiesByUser();
    
    console.log('✅ Página de registro inicializada con backend real');
}

function displayUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userNameElements = document.querySelectorAll('#user-name, .user-name');
    userNameElements.forEach(el => {
        el.textContent = `${user.nombres} ${user.apellidos}`;
    });
    
    console.log('👤 Usuario mostrado:', user.nombres, user.apellidos);
}

function filterCommunitiesByUser() {
    const user = getCurrentUser();
    const comunidadSelect = document.getElementById('comunidad');
    
    if (!user || !comunidadSelect) return;
    
    // Si el usuario tiene acceso a todas las comunidades
    if (user.comunidades_asignadas && user.comunidades_asignadas.includes('todas')) {
        return; // Mantener todas las opciones
    }
    
    // Filtrar solo las comunidades permitidas
    const opciones = comunidadSelect.querySelectorAll('option');
    opciones.forEach(opcion => {
        if (opcion.value && user.comunidades_asignadas && !user.comunidades_asignadas.includes(opcion.value)) {
            opcion.style.display = 'none';
        }
    });
    
    console.log('🏘️ Comunidades filtradas según permisos del usuario');
}

function setupRegistroListeners() {
    const registroForm = document.getElementById('registro-form');
    if (registroForm) {
        registroForm.addEventListener('submit', handleRegistroSubmit);
    }
    
    // Listeners para cálculos automáticos
    const metodoInputs = document.querySelectorAll('.metodo-inputs input[type="number"]');
    metodoInputs.forEach(input => {
        input.addEventListener('input', updateSummary);
        input.addEventListener('change', updateSummary);
        
        // Validar que no sean negativos
        input.addEventListener('input', function() {
            if (parseInt(this.value) < 0) {
                this.value = 0;
            }
        });
    });
    
    // Listener para cambio de comunidad
    const comunidadSelect = document.getElementById('comunidad');
    if (comunidadSelect) {
        comunidadSelect.addEventListener('change', onComunidadChange);
    }
}

function updateSummary() {
    const metodoInputs = document.querySelectorAll('.metodo-inputs input[type="number"]');
    let totalUsuarias = 0;
    let metodosUtilizados = 0;
    
    metodoInputs.forEach(input => {
        const valor = parseInt(input.value) || 0;
        totalUsuarias += valor;
        
        if (valor > 0) {
            metodosUtilizados++;
        }
    });
    
    // Actualizar resumen
    const totalElement = document.getElementById('total-usuarias');
    const metodosElement = document.getElementById('metodos-utilizados');
    
    if (totalElement) {
        totalElement.textContent = totalUsuarias.toLocaleString();
        
        // Cambiar color según la cantidad
        if (totalUsuarias === 0) {
            totalElement.style.color = '#7f8c8d';
        } else if (totalUsuarias <= 10) {
            totalElement.style.color = '#e74c3c';
        } else if (totalUsuarias <= 30) {
            totalElement.style.color = '#f39c12';
        } else {
            totalElement.style.color = '#2ecc71';
        }
    }
    
    if (metodosElement) {
        metodosElement.textContent = metodosUtilizados;
    }
}

function onComunidadChange() {
    const comunidadSelect = document.getElementById('comunidad');
    const comunidadId = comunidadSelect.value;
    
    if (comunidadId) {
        const comunidadText = comunidadSelect.options[comunidadSelect.selectedIndex].text;
        showNotification(`Seleccionada: ${comunidadText}`, 'info');
    }
}

async function handleRegistroSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    
    try {
        // Mostrar estado de carga
        submitBtn.disabled = true;
        submitBtn.textContent = '💾 Guardando...';
        
        // Recopilar datos del formulario
        const registroData = collectFormData();
        
        // Validar datos
        if (!validateRegistroData(registroData)) {
            return;
        }
        
        console.log('📤 Enviando registro al backend:', registroData);
        
        // Enviar al backend real
        const registroGuardado = await createRegistro(registroData);
        
        console.log('✅ Registro guardado en el backend:', registroGuardado);
        
        // Mostrar éxito
        showNotification(
            `Registro guardado correctamente para ${registroData.comunidad_nombre}`, 
            'success'
        );
        
        // Actualizar lista de registros
        await loadExistingRegistros();
        
        // Limpiar formulario
        resetForm();
        
        // Animar botón de éxito
        submitBtn.style.background = '#2ecc71';
        submitBtn.textContent = '✅ ¡Guardado!';
        
        setTimeout(() => {
            submitBtn.style.background = '';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error al guardar registro:', error);
        
        let errorMessage = 'Error al guardar el registro';
        
        if (error.message.includes('Ya existe un registro')) {
            errorMessage = 'Ya existe un registro para esta comunidad este mes';
        } else if (error.message.includes('No tienes acceso')) {
            errorMessage = 'No tienes permisos para registrar en esta comunidad';
        } else if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Error de conexión. Verifica que el backend esté funcionando';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = 'Sesión expirada o sin permisos. Inicia sesión nuevamente';
            setTimeout(() => logout(), 2000);
        } else {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
        
        submitBtn.style.background = '#e74c3c';
        submitBtn.textContent = '❌ Error';
        
        setTimeout(() => {
            submitBtn.style.background = '';
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }
}

function collectFormData() {
    const comunidadSelect = document.getElementById('comunidad');
    const fechaInput = document.getElementById('fecha');
    const observacionesInput = document.getElementById('observaciones');
    
    const comunidadId = comunidadSelect.value;
    const comunidadNombre = comunidadSelect.options[comunidadSelect.selectedIndex].text;
    
    const data = {
        comunidad_id: comunidadId,
        comunidad_nombre: comunidadNombre,
        fecha_registro: fechaInput.value,
        observaciones: observacionesInput.value.trim(),
        
        // Métodos de planificación
        iny_mensual: parseInt(document.querySelector('input[name="iny_mensual"]').value) || 0,
        iny_bimensual: parseInt(document.querySelector('input[name="iny_bimensual"]').value) || 0,
        iny_trimestral: parseInt(document.querySelector('input[name="iny_trimestral"]').value) || 0,
        pildoras: parseInt(document.querySelector('input[name="pildoras"]').value) || 0,
        pildora_emergencia: parseInt(document.querySelector('input[name="pildora_emergencia"]').value) || 0,
        diu: parseInt(document.querySelector('input[name="diu"]').value) || 0,
        implante: parseInt(document.querySelector('input[name="implante"]').value) || 0,
        condon_masculino: parseInt(document.querySelector('input[name="condon_masculino"]').value) || 0,
        condon_femenino: parseInt(document.querySelector('input[name="condon_femenino"]').value) || 0,
        mela: parseInt(document.querySelector('input[name="mela"]').value) || 0,
        collar: parseInt(document.querySelector('input[name="collar"]').value) || 0,
        aqv_femenina: parseInt(document.querySelector('input[name="aqv_femenina"]').value) || 0,
        aqv_masculina: parseInt(document.querySelector('input[name="aqv_masculina"]').value) || 0
    };
    
    return data;
}

function validateRegistroData(data) {
    // Validar comunidad
    if (!data.comunidad_id) {
        showNotification('Debe seleccionar una comunidad', 'warning');
        return false;
    }
    
    // Validar fecha
    if (!data.fecha_registro) {
        showNotification('Debe seleccionar una fecha', 'warning');
        return false;
    }
    
    // Validar que al menos un método tenga datos
    const totalUsuarias = calcularTotalUsuarias(data);
    if (totalUsuarias === 0) {
        showNotification('Debe ingresar al menos una usuaria en algún método', 'warning');
        return false;
    }
    
    // Validar fecha no futura
    const fechaRegistro = new Date(data.fecha_registro);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
    
    if (fechaRegistro > hoy) {
        showNotification('No se puede registrar datos de fechas futuras', 'warning');
        return false;
    }
    
    // Validar cantidad razonable
    if (totalUsuarias > 1000) {
        showNotification('La cantidad total parece muy alta. Verifica los datos.', 'warning');
        return false;
    }
    
    return true;
}

function resetForm() {
    const form = document.getElementById('registro-form');
    if (!form) return;
    
    // Limpiar todos los inputs numéricos
    const numberInputs = form.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.value = '';
    });
    
    // Limpiar observaciones
    const observacionesInput = document.getElementById('observaciones');
    if (observacionesInput) {
        observacionesInput.value = '';
    }
    
    // Actualizar resumen
    updateSummary();
    
    // Enfocar primer campo
    const comunidadSelect = document.getElementById('comunidad');
    if (comunidadSelect) {
        comunidadSelect.focus();
    }
    
    showNotification('Formulario limpiado', 'info');
}

async function loadExistingRegistros() {
    const registrosList = document.getElementById('registros-list');
    if (!registrosList) return;
    
    try {
        console.log('📡 Cargando registros del backend...');
        
        // Obtener registros del mes actual
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        const response = await getRegistros({
            año: currentYear,
            mes: currentMonth,
            limit: 20
        });
        
        const registros = response.registros || [];
        
        console.log('📋 Registros cargados:', registros.length);
        
        if (registros.length === 0) {
            registrosList.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                    <h4>No hay registros este mes</h4>
                    <p>Los registros que ingreses aparecerán aquí</p>
                </div>
            `;
            return;
        }
        
        registrosList.innerHTML = registros.map(registro => {
            const totalUsuarias = calcularTotalUsuarias(registro);
            const metodosUtilizados = contarMetodosUtilizados(registro);
            
            const statusClass = registro.estado === 'aprobado' ? 'success' : 
                               registro.estado === 'pendiente' ? 'warning' : 'info';
            
            const nombreUsuario = registro.usuario_registro 
                ? `${registro.usuario_registro.nombres} ${registro.usuario_registro.apellidos}`
                : 'Usuario desconocido';
            
            const user = getCurrentUser();
            const puedeEditar = (
                registro.registrado_por === user.id && registro.estado === 'pendiente'
            ) || ['admin', 'coordinador_municipal'].includes(user.rol);
            
            return `
                <div class="registro-item ${statusClass}">
                    <div class="registro-header">
                        <div class="registro-info">
                            <h4>${registro.comunidad_nombre || registro.comunidad_id}</h4>
                            <span class="registro-fecha">${formatDate(registro.fecha_registro)}</span>
                        </div>
                        <div class="registro-status">
                            <span class="status-badge ${statusClass}">${registro.estado}</span>
                        </div>
                    </div>
                    <div class="registro-stats">
                        <div class="stat-mini">
                            <span class="stat-value">${totalUsuarias}</span>
                            <span class="stat-label">Usuarias</span>
                        </div>
                        <div class="stat-mini">
                            <span class="stat-value">${metodosUtilizados}</span>
                            <span class="stat-label">Métodos</span>
                        </div>
                    </div>
                    <div class="registro-actions">
                        ${puedeEditar ? 
                            `<button class="btn-small btn-outline" onclick="editarRegistro(${registro.id})">
                                ✏️ Editar
                            </button>` : ''
                        }
                        <button class="btn-small" onclick="verDetalleRegistro(${registro.id})">
                            👁️ Ver
                        </button>
                    </div>
                    <div class="registro-user">
                        <small>Registrado por: ${nombreUsuario}</small>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Error al cargar registros:', error);
        
        registrosList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 15px; color: #e74c3c;">⚠️</div>
                <h4>Error al cargar registros</h4>
                <p>Verifica la conexión con el backend</p>
                <button onclick="loadExistingRegistros()" class="btn-secondary" style="margin-top: 10px;">
                    🔄 Reintentar
                </button>
            </div>
        `;
    }
}

async function editarRegistro(registroId) {
    try {
        console.log('✏️ Editando registro:', registroId);
        showNotification('Función de edición en desarrollo', 'info');
        
        // TODO: Implementar edición real
        // const registro = await getRegistroById(registroId);
        // fillFormWithRegistro(registro);
        
    } catch (error) {
        console.error('❌ Error al editar registro:', error);
        showNotification('Error al cargar el registro para edición', 'error');
    }
}

function verDetalleRegistro(registroId) {
    console.log('👁️ Ver detalle del registro:', registroId);
    showNotification(`Ver detalle del registro #${registroId}`, 'info');
    
    // TODO: Implementar vista de detalle
    // Podría abrir un modal o navegar a una página de detalle
}

// ===== ATAJOS DE TECLADO =====
document.addEventListener('keydown', function(e) {
    // Ctrl + S = Guardar
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('registro-form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl + R = Limpiar formulario
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetForm();
    }
    
    // Escape = Volver al dashboard
    if (e.key === 'Escape') {
        goToDashboard();
    }
    
    // F5 = Recargar registros
    if (e.key === 'F5') {
        e.preventDefault();
        loadExistingRegistros();
    }
});

// Exportar funciones para uso en HTML
window.resetForm = resetForm;
window.editarRegistro = editarRegistro;
window.verDetalleRegistro = verDetalleRegistro;
window.loadExistingRegistros = loadExistingRegistros;

console.log('📝 Registro.js cargado con API real - Atajos: Ctrl+S (Guardar), Ctrl+R (Limpiar), Esc (Volver), F5 (Recargar)');