// ========== CONFIGURATION ==========
var API_BASE = window.IMDAD_AUTH_API_BASE || 'https://imdad-backend-1.onrender.com/api';

// ========== UTILITY FUNCTIONS ==========
function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    var toast = document.getElementById('authToast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = 'toast-' + type;
    toast.style.display = 'block';
    
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() {
        toast.style.display = 'none';
    }, duration);
}

function showError(input, message) {
    var errorDiv = input.closest('.input-group')?.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
    }
    input.classList.add('input-error');
}

function clearError(input) {
    var errorDiv = input.closest('.input-group')?.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
    input.classList.remove('input-error');
}

function validateField(input) {
    clearError(input);
    var name = input.name;
    var value = input.value.trim();
    
    if (input.hasAttribute('required') && !value) {
        showError(input, 'This field is required');
        return false;
    }
    
    switch (name) {
        case 'phone':
            if (value && !/^[6-9]\d{9}$/.test(value)) {
                showError(input, 'Enter valid 10-digit Indian phone number');
                return false;
            }
            break;
        case 'email':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                showError(input, 'Enter valid email address');
                return false;
            }
            break;
        case 'pincode':
            if (value && !/^\d{6}$/.test(value)) {
                showError(input, 'Enter valid 6-digit pincode');
                return false;
            }
            break;
        case 'password':
            if (input.form && (input.form.id === 'donorForm' || input.form.id === 'madrasaForm')) {
                if (value && value.length < 6) {
                    showError(input, 'Password must be at least 6 characters');
                    return false;
                }
            }
            break;
        case 'establishedYear':
            if (value) {
                var year = parseInt(value);
                var currentYear = new Date().getFullYear();
                if (isNaN(year) || year < 1900 || year > currentYear) {
                    showError(input, 'Enter year between 1900-' + currentYear);
                    return false;
                }
            }
            break;
        case 'upiId':
            if (value && !/^[\w.-]+@[\w]+$/.test(value)) {
                showError(input, 'Enter valid UPI ID (e.g. name@upi)');
                return false;
            }
            break;
        case 'ifsc':
            if (value && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase())) {
                showError(input, 'Enter valid IFSC code');
                return false;
            }
            break;
    }
    
    input.classList.add('input-success');
    return true;
}

// ========== PASSWORD STRENGTH METER ==========
function checkPasswordStrength(password, meterId) {
    var meter = document.getElementById(meterId);
    if (!meter) return;
    
    var strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    meter.className = 'strength-meter';
    if (strength <= 2) meter.classList.add('strength-weak');
    else if (strength <= 4) meter.classList.add('strength-medium');
    else meter.classList.add('strength-strong');
}

// ========== PASSWORD TOGGLE (with accessibility update) ==========
function togglePassword(inputId, button) {
    var input = document.getElementById(inputId);
    var icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        button.setAttribute('aria-label', 'Show password');
    }
}

// ========== FILE UPLOAD HANDLING (with size validation) ==========
document.addEventListener('change', function(e) {
    if (e.target.type === 'file') {
        var fileUpload = e.target.closest('.file-upload');
        if (!fileUpload) return;
        
        var file = e.target.files[0];
        
        // File size validation (max 5MB)
        if (file && file.size > 5 * 1024 * 1024) {
            showToast('⚠️ File size must be under 5MB. Please choose a smaller file.', 'warning');
            e.target.value = ''; // clear the selection
            fileUpload.classList.add('file-error');
            fileUpload.classList.remove('file-selected');
            return;
        }
        
        if (e.target.files.length > 0) {
            fileUpload.classList.add('file-selected');
            fileUpload.classList.remove('file-error');
            var fileName = fileUpload.querySelector('.text-xs');
            if (fileName) {
                fileName.textContent = 'Selected: ' + e.target.files[0].name;
            }
        } else {
            fileUpload.classList.remove('file-selected');
            fileUpload.classList.add('file-error'); // cancel → show error again
        }
    }
});

// ========== MULTI-STEP NAVIGATION (MADRASA) ==========
var currentStep = 1;
var totalSteps = 3;

function updateStepUI() {
    // Hide all step containers
    document.querySelectorAll('.step-container').forEach(function(el) {
        el.classList.add('hidden');
    });
    // Show current step
    document.getElementById('step-' + currentStep).classList.remove('hidden');

    // Update progress steps
    var steps = document.querySelectorAll('.progress-step');
    var lines = document.querySelectorAll('.progress-line');
    steps.forEach(function(step, index) {
        step.classList.remove('active', 'completed');
        if (index + 1 < currentStep) step.classList.add('completed');
        if (index + 1 === currentStep) step.classList.add('active');
    });
    lines.forEach(function(line, index) {
        line.classList.toggle('completed', index + 1 < currentStep);
    });

    // Show/hide buttons
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var submitBtn = document.getElementById('submitBtn');

    prevBtn.classList.toggle('hidden', currentStep === 1);
    nextBtn.classList.toggle('hidden', currentStep === totalSteps);
    submitBtn.classList.toggle('hidden', currentStep !== totalSteps);
}

function changeStep(direction) {
    // Validate current step's required fields before moving forward
    if (direction === 1) {
        var currentStepEl = document.getElementById('step-' + currentStep);
        var requiredInputs = currentStepEl.querySelectorAll('[required]');
        var stepValid = true;
        requiredInputs.forEach(function(input) {
            if (input.type === 'file') {
                if (!input.files || input.files.length === 0) {
                    var fileUpload = input.closest('.file-upload');
                    if (fileUpload) fileUpload.classList.add('file-error');
                    stepValid = false;
                } else {
                    var fileUpload = input.closest('.file-upload');
                    if (fileUpload) fileUpload.classList.remove('file-error');
                }
            } else {
                if (!validateField(input)) {
                    stepValid = false;
                }
            }
        });
        if (!stepValid) {
            showToast('⚠️ Please fill all required fields correctly.', 'warning');
            return;
        }
    }

    currentStep += direction;
    if (currentStep < 1) currentStep = 1;
    if (currentStep > totalSteps) currentStep = totalSteps;
    updateStepUI();
}

// Expose changeStep globally (onclick used in HTML)
window.changeStep = changeStep;

// ========== SECTION NAVIGATION ==========
function switchTo(sectionId, subtitle) {
    ['login-section', 'role-section', 'donor-section', 'madrasa-section'].forEach(function(id) {
        document.getElementById(id).classList.add('hidden');
    });
    
    document.getElementById(sectionId).classList.remove('hidden');
    
    var subtitleEl = document.getElementById('page-subtitle');
    if (subtitleEl) subtitleEl.textContent = subtitle;
    
    var progressSteps = document.getElementById('progressSteps');
    if (progressSteps) {
        progressSteps.classList.toggle('hidden', sectionId !== 'madrasa-section');
    }
    
    // Initialize step UI when madrasa section shown
    if (sectionId === 'madrasa-section') {
        currentStep = 1;
        updateStepUI();
    }
}

// ========== FORM VALIDATION ON INPUT ==========
document.addEventListener('input', function(e) {
    if (e.target.matches('input:not([type="file"]):not([type="checkbox"]), textarea, select')) {
        if (e.target.value.trim()) {
            validateField(e.target);
        } else {
            clearError(e.target);
        }
    }
});

document.addEventListener('blur', function(e) {
    if (e.target.matches('input:not([type="file"]):not([type="checkbox"]), textarea, select')) {
        if (e.target.hasAttribute('required') || e.target.value.trim()) {
            validateField(e.target);
        }
    }
}, true);

document.getElementById('donorPassword')?.addEventListener('input', function() {
    checkPasswordStrength(this.value, 'donorStrengthMeter');
});
document.getElementById('madrasaPassword')?.addEventListener('input', function() {
    checkPasswordStrength(this.value, 'madrasaStrengthMeter');
});

// ========== LOADING STATE ==========
function setLoading(form, loading) {
    var btn = form.querySelector('.btn-emerald');
    var spinner = btn?.querySelector('.spinner');
    var btnText = btn?.querySelector('.btn-text');
    
    if (btn) btn.disabled = loading;
    if (spinner) spinner.style.display = loading ? 'block' : 'none';
    if (btnText) btnText.style.opacity = loading ? '0.7' : '1';
}

// ========== AUTH HELPERS ==========
function saveAuth(token, user) {
    var normalized = { ...user };
    if (!normalized.userId) {
        normalized.userId = user.userId || user._id || user.id;
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalized));
    localStorage.setItem('imdad_user', JSON.stringify(normalized));
}

function getAuthHeaders() {
    var token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
    };
}

function redirectBasedOnRole(role) {
    switch(role) {
        case 'madrasa':
            window.location.href = 'madrasa-dashboard.html';
            break;
        case 'donor':
            window.location.href = 'index.html';
            break;
        case 'admin':
            window.location.href = 'admin-panel.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

function getStoredAuthUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || localStorage.getItem('imdad_user') || '{}');
    } catch (err) {
        return {};
    }
}

// Check if already logged in (with timeout fallback for blank screen)
(function checkExistingAuth() {
    var token = localStorage.getItem('token');
    var user = getStoredAuthUser();
    
    if (token && user.role) {
        redirectBasedOnRole(user.role);
    } else {
        document.body.style.visibility = 'visible';
    }
})();

// Emergency fallback: show body after 5 seconds if still hidden
setTimeout(function() {
    if (document.body.style.visibility === 'hidden') {
        document.body.style.visibility = 'visible';
    }
}, 5000);

// ========== LOGIN FORM ==========
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var form = this;
    var phone = form.querySelector('input[name="phone"]').value.trim();
    var password = form.querySelector('input[name="password"]').value.trim();
    
    var phoneInput = form.querySelector('input[name="phone"]');
    var passwordInput = form.querySelector('input[name="password"]');
    var isValid = true;
    
    if (!phone) {
        showError(phoneInput, 'Phone number is required');
        isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
        showError(phoneInput, 'Enter valid 10-digit phone number');
        isValid = false;
    }
    
    if (!password) {
        showError(passwordInput, 'Password is required');
        isValid = false;
    }
    
    if (!isValid) return;
    
    setLoading(form, true);
    
    try {
        var response = await fetch(API_BASE + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone, password: password })
        });
        
        var data = await response.json();
        if (window.__imdadDebugLog) window.__imdadDebugLog('auth.js:login', 'Login response', { ok: response.ok, success: !!data.success, status: response.status, role: data.user && data.user.role });
        
        if (data.success) {
            saveAuth(data.token, data.user);
            showToast('✅ Login successful! Redirecting...', 'success', 2000);
            setTimeout(function() {
                redirectBasedOnRole(data.user.role);
            }, 1500);
        } else {
            showToast(data.error || 'Login failed!', 'error');
        }
    } catch (err) {
        console.error('Login error:', err);
        showToast('❌ Server error! Please try again.', 'error');
    } finally {
        setLoading(form, false);
    }
});

// ========== DONOR REGISTRATION ==========
document.getElementById('donorForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var form = this;
    var fullName = form.querySelector('input[name="fullName"]').value.trim();
    var phone = form.querySelector('input[name="phone"]').value.trim();
    var password = form.querySelector('input[name="password"]').value.trim();
    var terms = form.querySelector('input[name="terms"]').checked;
    
    var nameInput = form.querySelector('input[name="fullName"]');
    var phoneInput = form.querySelector('input[name="phone"]');
    var passwordInput = form.querySelector('input[name="password"]');
    var isValid = true;
    
    if (!fullName || fullName.length < 2) {
        showError(nameInput, 'Enter your full name');
        isValid = false;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
        showError(phoneInput, 'Enter valid 10-digit phone number');
        isValid = false;
    }
    if (!password || password.length < 6) {
        showError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    }
    if (!terms) {
        showToast('⚠️ Please agree to Terms & Conditions', 'warning');
        isValid = false;
    }
    
    if (!isValid) return;
    
    setLoading(form, true);
    
    try {
        var response = await fetch(API_BASE + '/register/donor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName: fullName, phone: phone, password: password })
        });
        
        var data = await response.json();
        
        if (data.success) {
            showToast('✅ Account created! Please login now.', 'success', 3000);
            setTimeout(function() { switchTo('login-section', 'Sign in to your account'); }, 1500);
            form.reset();
        } else {
            showToast(data.error || 'Registration failed!', 'error');
        }
    } catch (err) {
        console.error('Donor registration error:', err);
        showToast('❌ Server error! Please try again.', 'error');
    } finally {
        setLoading(form, false);
    }
});

// ========== MADRASA REGISTRATION ==========
document.getElementById('madrasaForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    var form = this;
    var terms = form.querySelector('input[name="terms"]').checked;
    
    if (!terms) {
        showToast('⚠️ Please agree to Terms & Conditions', 'warning');
        return;
    }
    
    // Final validation of all required fields (just in case)
    var requiredInputs = form.querySelectorAll('[required]');
    var isValid = true;
    requiredInputs.forEach(function(input) {
        if (input.type === 'file') {
            if (!input.files || input.files.length === 0) {
                var fileUpload = input.closest('.file-upload');
                if (fileUpload) fileUpload.classList.add('file-error');
                isValid = false;
            }
        } else if (!input.value.trim()) {
            showError(input, 'This field is required');
            isValid = false;
        }
    });
    
    if (!isValid) {
        showToast('⚠️ Please fill all required fields correctly.', 'warning');
        return;
    }
    
    setLoading(form, true);
    
    try {
        var formData = new FormData(form);
        
        var response = await fetch(API_BASE + '/register/madrasa', {
            method: 'POST',
            body: formData
        });
        
        var data = await response.json();
        
        if (data.success) {
            showToast('✅ Registration submitted! Pending verification.', 'success', 4000);
            if (data.madrasaId) {
                localStorage.setItem('pendingMadrasaId', data.madrasaId);
            }
            setTimeout(function() { switchTo('login-section', 'Sign in to your account'); }, 2000);
            form.reset();
            // Reset steps
            currentStep = 1;
            updateStepUI();
        } else {
            showToast(data.error || 'Registration failed!', 'error');
        }
    } catch (err) {
        console.error('Madrasa registration error:', err);
        showToast('❌ Server error! Please try again.', 'error');
    } finally {
        setLoading(form, false);
    }
});

// ========== LOGOUT FUNCTION ==========
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('imdad_user');
    window.location.href = 'auth.html';
}
window.logout = logout;

console.log('✅ Auth.js loaded with multi-step support, accessibility, and bug fixes');
