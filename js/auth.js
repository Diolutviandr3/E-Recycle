// User Management System - FIXED VERSION
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = {};
        this.init();
    }
    
    init() {
        // Setup demo accounts
        this.setupDemoAccounts();
        
        // Check for saved login
        this.checkSavedLogin();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupDemoAccounts() {
        // Always create fresh demo accounts on init
        const demoAccounts = {
            'admin@gmail.com': {
                id: 1,
                name: 'Admin System',
                email: 'admin@gmail.com',
                password: 'admin123',
                role: 'admin',
                phone: '081234567890',
                address: 'Kantor Pusat E-Recycle',
                createdAt: new Date().toISOString(),
                balance: 0,
                points: 0,
                transactions: []
            },
            'pengepul@gmail.com': {
                id: 2,
                name: 'Bank Sampah UAD',
                email: 'pengepul@gmail.com',
                password: 'pengepul123',
                role: 'pengepul',
                phone: '081234567891',
                address: 'Jl. Ringroad Selatan, Yogyakarta',
                createdAt: new Date().toISOString(),
                location: { lat: -7.801194, lng: 110.364917 },
                capacity: 1000,
                currentLoad: 350,
                balance: 1250000,
                points: 5000,
                transactions: []
            },
            'masyarakat@gmail.com': {
                id: 3,
                name: 'Dio Lutvi',
                email: 'masyarakat@gmail.com',
                password: 'masyarakat123',
                role: 'masyarakat',
                phone: '081234567892',
                address: 'Perumahan Griya Indah No. 12',
                createdAt: new Date().toISOString(),
                balance: 125000,
                points: 1250,
                transactions: []
            }
        };
        
        // Get existing users or create new
        const savedUsers = localStorage.getItem('eRecycleUsers');
        if (savedUsers) {
            this.users = JSON.parse(savedUsers);
            
            // Update demo accounts if they exist with old emails
            const oldEmails = ['admin@erecycle.id', 'pengepul@erecycle.id', 'masyarakat@erecycle.id'];
            oldEmails.forEach(oldEmail => {
                if (this.users[oldEmail]) {
                    delete this.users[oldEmail];
                }
            });
            
            // Merge demo accounts with existing users
            this.users = { ...demoAccounts, ...this.users };
        } else {
            this.users = demoAccounts;
        }
        
        localStorage.setItem('eRecycleUsers', JSON.stringify(this.users));
    }
    
    checkSavedLogin() {
        const savedUser = localStorage.getItem('eRecycleCurrentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                
                // Check if user still exists in system
                if (!this.users[this.currentUser.email]) {
                    this.currentUser = null;
                    localStorage.removeItem('eRecycleCurrentUser');
                    this.showNotification('Sesi Berakhir', 'Silakan login kembali', 'info');
                    return;
                }
                
                // Redirect if on login page
                if (window.location.pathname.includes('index.html')) {
                    this.redirectToDashboard();
                }
            } catch (error) {
                console.error('Error parsing saved user:', error);
                this.currentUser = null;
                localStorage.removeItem('eRecycleCurrentUser');
            }
        }
    }
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        // Register link
        const registerLink = document.getElementById('registerLink');
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }
        
        // Close register modal
        const closeRegisterModal = document.getElementById('closeRegisterModal');
        if (closeRegisterModal) {
            closeRegisterModal.addEventListener('click', () => {
                this.hideRegisterModal();
            });
        }
        
        // Reset demo data button (add this to HTML)
        const resetDemoBtn = document.getElementById('resetDemoBtn');
        if (resetDemoBtn) {
            resetDemoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetDemoData();
            });
        }
    }
    
    handleLogin(e) {
        e.preventDefault();
        
        const role = document.getElementById('loginRole').value;
        const email = document.getElementById('loginEmail').value.trim().toLowerCase();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe')?.checked;
        
        if (!role || !email || !password) {
            this.showNotification('Error', 'Harap isi semua field', 'error');
            return;
        }
        
        // Debug: Log available users
        console.log('Available users:', Object.keys(this.users));
        
        // Check if user exists
        const user = this.users[email];
        if (!user) {
            this.showNotification('Login Gagal', 'Email tidak terdaftar', 'error');
            return;
        }
        
        // Check role
        if (user.role !== role) {
            this.showNotification('Login Gagal', 'Peran tidak sesuai', 'error');
            return;
        }
        
        // Check password
        if (user.password !== password) {
            this.showNotification('Login Gagal', 'Password salah', 'error');
            return;
        }
        
        // Login successful
        this.currentUser = user;
        localStorage.setItem('eRecycleCurrentUser', JSON.stringify(user));
        
        this.showNotification('Login Berhasil', `Selamat datang ${user.name}!`, 'success');
        
        // Redirect after 1 second
        setTimeout(() => {
            this.redirectToDashboard();
        }, 1000);
    }
    
    handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim().toLowerCase();
        const phone = document.getElementById('registerPhone').value.trim();
        const address = document.getElementById('registerAddress').value.trim();
        const role = document.getElementById('registerRole').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        // Validation
        if (!name || !email || !phone || !role || !password || !confirmPassword) {
            this.showNotification('Error', 'Harap isi semua field wajib', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showNotification('Error', 'Format email tidak valid', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Error', 'Password minimal 6 karakter', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Error', 'Password dan konfirmasi tidak cocok', 'error');
            return;
        }
        
        // Check if email already exists
        if (this.users[email]) {
            this.showNotification('Error', 'Email sudah terdaftar', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Object.keys(this.users).length + 1,
            name,
            email,
            password,
            role,
            phone,
            address,
            createdAt: new Date().toISOString(),
            balance: 0,
            points: role === 'masyarakat' ? 100 : 0,
            transactions: []
        };
        
        // Add specific fields based on role
        if (role === 'pengepul') {
            newUser.location = { 
                lat: -7.8 + (Math.random() * 0.1), 
                lng: 110.36 + (Math.random() * 0.1) 
            };
            newUser.capacity = 1000;
            newUser.currentLoad = 0;
        }
        
        // Add schedules for masyarakat
        if (role === 'masyarakat') {
            newUser.schedules = [];
        }
        
        // Save user
        this.users[email] = newUser;
        localStorage.setItem('eRecycleUsers', JSON.stringify(this.users));
        
        this.showNotification('Pendaftaran Berhasil', 'Akun berhasil dibuat! Silakan login.', 'success');
        
        // Close modal and reset form
        setTimeout(() => {
            this.hideRegisterModal();
            document.getElementById('registerForm').reset();
        }, 1500);
    }
    
    resetDemoData() {
        if (confirm('Reset semua data demo ke pengaturan awal? Data yang Anda buat akan hilang.')) {
            localStorage.removeItem('eRecycleUsers');
            localStorage.removeItem('eRecycleCurrentUser');
            localStorage.removeItem('eRecycleSettings');
            
            // Recreate demo accounts
            this.setupDemoAccounts();
            
            this.showNotification('Berhasil', 'Data demo telah direset', 'success');
            
            // Reload page after 1 second
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }
    
    showRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    hideRegisterModal() {
        const modal = document.getElementById('registerModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    redirectToDashboard() {
        if (!this.currentUser) return;
        
        switch(this.currentUser.role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'pengepul':
                window.location.href = 'pengepul-dashboard.html';
                break;
            case 'masyarakat':
                window.location.href = 'masyarakat-dashboard.html';
                break;
        }
    }
    
    logout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            this.currentUser = null;
            localStorage.removeItem('eRecycleCurrentUser');
            window.location.href = 'index.html';
        }
    }
    
    showNotification(title, message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationTitle = document.getElementById('notification-title');
        const notificationMessage = document.getElementById('notification-message');
        
        if (!notification || !notificationTitle || !notificationMessage) {
            // Fallback to alert
            alert(`${title}: ${message}`);
            return;
        }
        
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        // Set border color based on type
        const borderColors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.style.borderLeftColor = borderColors[type] || borderColors.success;
        
        const iconElement = notification.querySelector('.notification-icon i');
        if (iconElement) {
            iconElement.className = `fas ${icons[type] || icons.success}`;
        }
        
        notification.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
        
        // Close button
        const closeBtn = document.getElementById('notification-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                notification.style.display = 'none';
            };
        }
    }
}

// Initialize auth system
const auth = new AuthSystem();