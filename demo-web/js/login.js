// ===== LÓGICA DEL LOGIN CON API REAL =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Página de login cargada - Conectado al backend');
    
    // Probar conexión al backend
    testConnection();
    
    // Configurar event listeners
    setupLoginListeners();
    
    // Si ya hay sesión, redirigir al dashboard
    if (isLoggedIn()) {
        showNotification('Ya tienes una sesión activa', 'info');
        setTimeout(goToDashboard, 1000);
        return;
    }
    
    // Enfocar el primer campo
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.focus();
    }
});

function setupLoginListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Permitir login con Enter en cualquier campo
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin(e);
            }
        });
    });
    
    // Animación suave para los campos de entrada
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
}

async function handleLogin(event) {
    event.preventDefault();
    
    const submitBtn = document.querySelector('.login-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validaciones básicas
    if (!email || !password) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }
    
    // Mostrar estado de carga
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
        console.log('🔐 Intentando login con backend real:', email);
        
        // Llamar a la API real
        const user = await loginUser(email, password);
        
        console.log('✅ Login exitoso con backend:', user.nombres);
        
        // Mostrar mensaje de éxito
        showNotification(`¡Bienvenido, ${user.nombres}!`, 'success');
        
        // Animación de éxito en el botón
        submitBtn.style.background = '#2ecc71';
        btnLoading.textContent = '¡Éxito!';
        
        // Redirigir al dashboard
        setTimeout(() => {
            goToDashboard();
        }, 1500);
        
    } catch (error) {
        console.log('❌ Login fallido:', error.message);
        
        // Mostrar error específico del backend
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.message.includes('Credenciales incorrectas')) {
            errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Usuario bloqueado')) {
            errorMessage = 'Usuario bloqueado. Contacta al administrador';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando';
        } else {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, 'error');
        
        // Animación de error
        submitBtn.style.background = '#e74c3c';
        btnLoading.textContent = 'Error';
        
        // Resetear el formulario después de un momento
        setTimeout(() => {
            resetLoginForm();
        }, 2000);
    }
}

function resetLoginForm() {
    const submitBtn = document.querySelector('.login-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Resetear botón
    submitBtn.disabled = false;
    submitBtn.style.background = '';
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    btnLoading.textContent = 'Verificando...';
    
    // Enfocar email nuevamente
    document.getElementById('email').focus();
}

// Función para cambiar entre usuarios demo rápidamente
function quickLogin(userType) {
    const credentials = {
        admin: { email: 'admin@mspas.gob.gt', password: '123456' },
        aux: { email: 'aux01@mspas.gob.gt', password: '123456' }
    };
    
    if (credentials[userType]) {
        document.getElementById('email').value = credentials[userType].email;
        document.getElementById('password').value = credentials[userType].password;
        
        // Ejecutar login automáticamente
        const event = new Event('submit');
        document.getElementById('login-form').dispatchEvent(event);
    }
}

// Función para probar diferentes escenarios
async function testLoginScenarios() {
    console.log('🧪 Probando escenarios de login...');
    
    try {
        // Probar credenciales incorrectas
        await loginUser('test@test.com', 'wrong');
    } catch (error) {
        console.log('✅ Error esperado para credenciales incorrectas:', error.message);
    }
    
    try {
        // Probar email inválido
        await loginUser('invalid-email', '123456');
    } catch (error) {
        console.log('✅ Error esperado para email inválido:', error.message);
    }
    
    console.log('🧪 Pruebas de login completadas');
}

// Agregar atajos de teclado para desarrollo rápido
document.addEventListener('keydown', function(e) {
    // Ctrl + 1 = Login como admin
    if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        quickLogin('admin');
    }
    
    // Ctrl + 2 = Login como auxiliar
    if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        quickLogin('aux');
    }
    
    // Ctrl + T = Probar conexión
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        testConnection();
    }
    
    // Ctrl + Shift + T = Probar escenarios
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        testLoginScenarios();
    }
});

// Verificar estado del backend al cargar
window.addEventListener('load', async () => {
    try {
        const response = await fetch('http://localhost:5000/health');
        if (response.ok) {
            console.log('✅ Backend disponible');
            // Agregar indicador visual de conexión
            const indicator = document.createElement('div');
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: #2ecc71;
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                z-index: 1000;
            `;
            indicator.textContent = '🟢 Backend Conectado';
            document.body.appendChild(indicator);
        }
    } catch (error) {
        console.warn('⚠️ Backend no disponible');
        showNotification('Backend no disponible. Verifica que esté ejecutándose en puerto 5000', 'warning', 8000);
    }
});

// Exportar funciones para uso en HTML
window.handleLogin = handleLogin;
window.quickLogin = quickLogin;
window.testLoginScenarios = testLoginScenarios;

console.log('🚀 Login.js cargado con API real - Atajos: Ctrl+1 (Admin), Ctrl+2 (Auxiliar), Ctrl+T (Test)');