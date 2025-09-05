// ===== LÓGICA DEL LOGIN =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Página de login cargada');
    
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
        console.log('🔐 Intentando login:', email);
        
        // Simular verificación en servidor
        await simulateServerLogin(email, password);
        
        // Verificar credenciales
        if (DEMO_DATA.usuarios[email] && DEMO_DATA.usuarios[email].password === password) {
            const userData = {
                email: email,
                ...DEMO_DATA.usuarios[email]
            };
            
            // Guardar sesión
            setCurrentUser(userData);
            
            console.log('✅ Login exitoso:', userData.nombre);
            
            // Mostrar mensaje de éxito
            showNotification(`¡Bienvenido, ${userData.nombre}!`, 'success');
            
            // Animación de éxito en el botón
            submitBtn.style.background = '#2ecc71';
            btnLoading.textContent = '¡Éxito!';
            
            // Redirigir al dashboard
            setTimeout(() => {
                goToDashboard();
            }, 1500);
            
        } else {
            throw new Error('Credenciales incorrectas');
        }
        
    } catch (error) {
        console.log('❌ Login fallido:', error.message);
        
        // Mostrar error
        showNotification(
            'Credenciales incorrectas. Usa: admin@mspas.gob.gt / 123456', 
            'error'
        );
        
        // Animación de error
        submitBtn.style.background = '#e74c3c';
        btnLoading.textContent = 'Error';
        
        // Resetear el formulario después de un momento
        setTimeout(() => {
            resetLoginForm();
        }, 2000);
    }
}

function simulateServerLogin(email, password) {
    return new Promise((resolve, reject) => {
        // Simular latencia de red
        setTimeout(() => {
            if (DEMO_DATA.usuarios[email] && DEMO_DATA.usuarios[email].password === password) {
                resolve();
            } else {
                reject(new Error('Credenciales incorrectas'));
            }
        }, 1500); // 1.5 segundos de "verificación"
    });
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
    
    // Limpiar campos (opcional)
    // document.getElementById('password').value = '';
    
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
});

// Exportar funciones para uso en HTML
window.handleLogin = handleLogin;
window.quickLogin = quickLogin;

console.log('🚀 Login.js cargado - Atajos: Ctrl+1 (Admin), Ctrl+2 (Auxiliar)');