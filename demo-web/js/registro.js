// ===== LÓGICA DEL REGISTRO DE DATOS =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Página de registro cargada');
    
    // Verificar sesión
    if (!verificarSesion()) {
        return;
    }
    
    // Inicializar página
    initializeRegistroPage();
    
    // Configurar event listeners
    setupRegistroListeners();
    
    // Cargar registros existentes
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
    
    console.log('✅ Página de registro inicializada');
}

function displayUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userNameElements = document.querySelectorAll('#user-name, .user-name');
    userNameElements.forEach(el => el.textContent = user.nombre);
}

function filterCommunitiesByUser() {
    const user = getCurrentUser();
    const comunidadSelect = document.getElementById('comunidad');
    
    if (!user || !comunidadSelect) return;
    
    // Si el usuario tiene acceso a todas las comunidades
    if (user.comunidades.includes('todas')) {
        return; // Mantener todas las opciones
    }
    
    // Filtrar solo las comunidades permitidas
    const opciones = comunidadSelect.querySelectorAll('option');
    opciones.forEach(opcion => {
        if (opcion.value && !user.comunidades.includes(opcion.value)) {
            opcion.style.display = 'none';
        }
    });
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
        const comunidad = DEMO_DATA.comunidades.find(c => c.id === comunidadId);
        if (comunidad) {
            showNotification(`Seleccionada: ${comunidad.nombre} (${comunidad.poblacion_mef} MEF)`, 'info');
        }
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
        
        // Simular guardado en servidor
        await simulateServerSave(registroData);
        
        // Guardar en localStorage
        const registroGuardado = guardarRegistro(registroData);
        
        // Mostrar éxito
        showNotification(
            `Registro guardado correctamente para ${registroData.comunidadNombre}`, 
            'success'
        );
        
        // Actualizar lista de registros
        loadExistingRegistros();
        
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
        console.error('Error al guardar registro:', error);
        showNotification('Error al guardar el registro. Intenta nuevamente.', 'error');
        
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
    const comunidad = DEMO_DATA.comunidades.find(c => c.id === comunidadId);
    
    const data = {
        comunidad: comunidadId,
        comunidadNombre: comunidad ? comunidad.nombre : 'Desconocida',
        fecha: fechaInput.value,
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
    if (!data.comunidad) {
        showNotification('Debe seleccionar una comunidad', 'warning');
        return false;
    }
    
    // Validar fecha
    if (!data.fecha) {
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
    const fechaRegistro = new Date(data.fecha);
    const hoy = new Date();
    if (fechaRegistro > hoy) {
        showNotification('No se puede registrar datos de fechas futuras', 'warning');
        return false;
    }
    
    return true;
}

function simulateServerSave(data) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simular éxito/fallo aleatorio (90% éxito)
            if (Math.random() > 0.1) {
                resolve();
            } else {
                reject(new Error('Error de conexión con el servidor'));
            }
        }, 1500);
    });
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

function loadExistingRegistros() {
    const registrosList = document.getElementById('registros-list');
    if (!registrosList) return;
    
    const registrosGuardados = getRegistrosGuardados();
    const registrosRecientes = [...DEMO_DATA.registrosRecientes, ...registrosGuardados]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 10); // Últimos 10
    
    if (registrosRecientes.length === 0) {
        registrosList.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px; margin-bottom: 15px;">📋</div>
                <h4>No hay registros este mes</h4>
                <p>Los registros que ingreses aparecerán aquí</p>
            </div>
        `;
        return;
    }
    
    registrosList.innerHTML = registrosRecientes.map(registro => {
        const totalUsuarias = calcularTotalUsuarias(registro);
        const metodosUtilizados = contarMetodosUtilizados(registro);
        
        const statusClass = registro.estado === 'aprobado' ? 'success' : 
                           registro.estado === 'pendiente' ? 'warning' : 'info';
        
        return `
            <div class="registro-item ${statusClass}">
                <div class="registro-header">
                    <div class="registro-info">
                        <h4>${registro.comunidadNombre || registro.comunidad}</h4>
                        <span class="registro-fecha">${formatDate(registro.fecha)}</span>
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
                    ${registro.id && registro.estado === 'pendiente' ? 
                        `<button class="btn-small btn-outline" onclick="editarRegistro(${registro.id})">
                            ✏️ Editar
                        </button>` : ''
                    }
                    <button class="btn-small" onclick="verDetalleRegistro(${registro.id || 'demo'})">
                        👁️ Ver
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function editarRegistro(registroId) {
    const registros = getRegistrosGuardados();
    const registro = registros.find(r => r.id === registroId);
    
    if (!registro) {
        showNotification('Registro no encontrado', 'error');
        return;
    }
    
    // Llenar formulario con datos del registro
    fillFormWithRegistro(registro);
    
    showNotification(`Editando registro de ${registro.comunidadNombre}`, 'info');
    
    // Scroll al formulario
    document.querySelector('.registro-form').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function fillFormWithRegistro(registro) {
    // Llenar campos básicos
    document.getElementById('comunidad').value = registro.comunidad || '';
    document.getElementById('fecha').value = registro.fecha || '';
    document.getElementById('observaciones').value = registro.observaciones || '';
    
    // Llenar métodos
    const campos = [
        'iny_mensual', 'iny_bimensual', 'iny_trimestral',
        'pildoras', 'pildora_emergencia',
        'diu', 'implante',
        'condon_masculino', 'condon_femenino',
        'mela', 'collar',
        'aqv_femenina', 'aqv_masculina'
    ];
    
    campos.forEach(campo => {
        const input = document.querySelector(`input[name="${campo}"]`);
        if (input && registro[campo]) {
            input.value = registro[campo];
        }
    });
    
    // Actualizar resumen
    updateSummary();
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
});

// Exportar funciones para uso en HTML
window.resetForm = resetForm;
window.editarRegistro = editarRegistro;
window.verDetalleRegistro = verDetalleRegistro;

console.log('📝 Registro.js cargado - Atajos: Ctrl+S (Guardar), Ctrl+R (Limpiar), Esc (Volver)');