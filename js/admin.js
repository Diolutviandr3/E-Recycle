// Admin Dashboard Functionality - FIXED VERSION
class AdminDashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('eRecycleCurrentUser'));
        this.users = JSON.parse(localStorage.getItem('eRecycleUsers')) || {};
        
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        
        this.init();
    }
    
    init() {
        this.updateUserInfo();
        this.setupEventListeners();
        
        // Listen for page load events
        document.addEventListener('pageLoad', (e) => {
            this.onPageLoad(e.detail.pageId);
        });
        
        // Load initial page
        this.loadPageData('dashboard');
    }
    
    updateUserInfo() {
        const adminName = document.getElementById('adminName');
        const adminRole = document.getElementById('adminRole');
        const currentDate = document.getElementById('currentDate');
        
        if (adminName) adminName.textContent = this.currentUser.name;
        if (adminRole) adminRole.textContent = 'Administrator';
        
        if (currentDate) {
            const now = new Date();
            currentDate.textContent = now.toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }
    
    setupEventListeners() {
        // User management
        document.getElementById('addUserBtn')?.addEventListener('click', () => {
            this.showUserModal();
        });
        
        document.getElementById('closeUserModal')?.addEventListener('click', () => {
            this.hideUserModal();
        });
        
        document.getElementById('cancelUserBtn')?.addEventListener('click', () => {
            this.hideUserModal();
        });
        
        document.getElementById('userForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });
        
        // Filter users
        document.getElementById('filterRole')?.addEventListener('change', () => {
            this.filterUsers();
        });
        
        document.getElementById('searchUser')?.addEventListener('input', () => {
            this.filterUsers();
        });
        
        // Settings form
        document.getElementById('systemSettings')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
        
        // Logout is handled by main.js
    }
    
    onPageLoad(pageId) {
        console.log(`Admin page loaded: ${pageId}`);
        this.loadPageData(pageId);
    }
    
    loadPageData(pageId) {
        showLoading();
        
        setTimeout(() => {
            switch(pageId) {
                case 'dashboard':
                    this.loadDashboardData();
                    break;
                case 'users':
                    this.loadUsersData();
                    break;
                case 'locations':
                    this.loadLocationsData();
                    break;
                case 'transactions':
                    this.loadTransactionsData();
                    break;
                case 'reports':
                    this.loadReportsData();
                    break;
                case 'settings':
                    this.loadSettingsData();
                    break;
                default:
                    console.warn(`Unknown page: ${pageId}`);
            }
            
            hideLoading();
        }, 300);
    }
    
    loadDashboardData() {
        // Calculate statistics
        const userList = Object.values(this.users);
        const masyarakatUsers = userList.filter(u => u.role === 'masyarakat');
        const pengepulUsers = userList.filter(u => u.role === 'pengepul');
        const adminUsers = userList.filter(u => u.role === 'admin');
        
        // Update statistics
        document.getElementById('totalUsers').textContent = userList.length;
        document.getElementById('totalPengepul').textContent = pengepulUsers.length;
        
        // Calculate totals
        let totalTransactions = 0;
        let totalWaste = 0;
        let todayTransactions = 0;
        let todayWaste = 0;
        
        const today = new Date().toDateString();
        
        userList.forEach(user => {
            if (user.transactions) {
                totalTransactions += user.transactions.length;
                
                user.transactions.forEach(t => {
                    totalWaste += t.weight || 0;
                    
                    // Check if transaction is today
                    const transDate = new Date(t.date).toDateString();
                    if (transDate === today) {
                        todayTransactions++;
                        todayWaste += t.weight || 0;
                    }
                });
            }
        });
        
        document.getElementById('totalTransactions').textContent = todayTransactions;
        document.getElementById('totalWaste').textContent = `${todayWaste} kg`;
        
        // Load recent activities
        this.loadRecentActivities();
    }
    
    loadRecentActivities() {
        const tbody = document.querySelector('#recentActivities tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Collect all activities from users
        let activities = [];
        Object.values(this.users).forEach(user => {
            if (user.transactions) {
                user.transactions.forEach(transaction => {
                    activities.push({
                        time: new Date(transaction.date).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}),
                        user: user.name,
                        action: 'Transaksi',
                        detail: `Menjual ${transaction.weight}kg ${transaction.type}`
                    });
                });
            }
            
            // Add registration activity
            activities.push({
                time: new Date(user.createdAt).toLocaleDateString('id-ID'),
                user: user.name,
                action: 'Registrasi',
                detail: 'Bergabung sebagai pengguna baru'
            });
        });
        
        // Sort by date (newest first) and take 5
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        activities = activities.slice(0, 5);
        
        activities.forEach(activity => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${activity.time}</td>
                <td>${activity.user}</td>
                <td>${activity.action}</td>
                <td>${activity.detail}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    loadUsersData() {
        this.loadUsersTable();
    }
    
    loadUsersTable() {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const userList = Object.values(this.users);
        
        userList.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge ${user.role}">
                        ${this.getRoleDisplayName(user.role)}
                    </span>
                </td>
                <td>${user.phone || '-'}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td><span class="status-badge active">Aktif</span></td>
                <td>
                    <button class="btn btn-sm btn-edit" data-email="${user.email}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" data-email="${user.email}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners
        tbody.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const email = e.currentTarget.getAttribute('data-email');
                this.editUser(email);
            });
        });
        
        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const email = e.currentTarget.getAttribute('data-email');
                this.deleteUser(email);
            });
        });
    }
    
    getRoleDisplayName(role) {
        switch(role) {
            case 'admin': return 'Admin';
            case 'pengepul': return 'Pengepul';
            case 'masyarakat': return 'Masyarakat';
            default: return role;
        }
    }
    
    filterUsers() {
        const roleFilter = document.getElementById('filterRole')?.value || '';
        const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';
        const rows = document.querySelectorAll('#usersTable tbody tr');
        
        rows.forEach(row => {
            const role = row.cells[3].textContent.toLowerCase();
            const name = row.cells[1].textContent.toLowerCase();
            const email = row.cells[2].textContent.toLowerCase();
            
            const roleMatch = !roleFilter || role.includes(roleFilter.toLowerCase());
            const searchMatch = !searchTerm || 
                name.includes(searchTerm) || 
                email.includes(searchTerm);
            
            row.style.display = roleMatch && searchMatch ? '' : 'none';
        });
    }
    
    showUserModal(user = null) {
        const modal = document.getElementById('userModal');
        const title = document.getElementById('modalUserTitle');
        const passwordFields = document.getElementById('passwordFields');
        
        if (user) {
            title.textContent = 'Edit Pengguna';
            document.getElementById('userId').value = user.email;
            document.getElementById('modalUserName').value = user.name;
            document.getElementById('modalUserEmail').value = user.email;
            document.getElementById('modalUserRole').value = user.role;
            document.getElementById('modalUserPhone').value = user.phone || '';
            document.getElementById('modalUserAddress').value = user.address || '';
            passwordFields.style.display = 'none';
        } else {
            title.textContent = 'Tambah Pengguna';
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            passwordFields.style.display = 'block';
        }
        
        modal.style.display = 'flex';
    }
    
    hideUserModal() {
        document.getElementById('userModal').style.display = 'none';
    }
    
    saveUser() {
        const id = document.getElementById('userId').value;
        const name = document.getElementById('modalUserName').value;
        const email = document.getElementById('modalUserEmail').value;
        const role = document.getElementById('modalUserRole').value;
        const phone = document.getElementById('modalUserPhone').value;
        const address = document.getElementById('modalUserAddress').value;
        const password = document.getElementById('modalUserPassword').value;
        
        if (!name || !email || !role) {
            this.showNotification('Error', 'Harap isi semua field wajib', 'error');
            return;
        }
        
        if (!id && !password) {
            this.showNotification('Error', 'Password wajib untuk pengguna baru', 'error');
            return;
        }
        
        let userData;
        
        if (id) {
            // Update existing user
            userData = this.users[id];
            if (!userData) {
                this.showNotification('Error', 'Pengguna tidak ditemukan', 'error');
                return;
            }
            
            userData.name = name;
            userData.role = role;
            userData.phone = phone;
            userData.address = address;
            
            if (password) {
                userData.password = password;
            }
            
            // Update email if changed
            if (id !== email) {
                delete this.users[id];
                userData.email = email;
            }
        } else {
            // Create new user
            userData = {
                id: Object.keys(this.users).length + 1,
                name,
                email,
                password: password || 'password123',
                role,
                phone,
                address,
                createdAt: new Date().toISOString(),
                balance: 0,
                points: role === 'masyarakat' ? 100 : 0,
                transactions: []
            };
            
            if (role === 'pengepul') {
                userData.location = { 
                    lat: -7.8 + (Math.random() * 0.1), 
                    lng: 110.36 + (Math.random() * 0.1) 
                };
                userData.capacity = 1000;
                userData.currentLoad = 0;
            }
        }
        
        // Save user
        this.users[email] = userData;
        localStorage.setItem('eRecycleUsers', JSON.stringify(this.users));
        
        // Update current user if editing own profile
        if (this.currentUser.email === id || this.currentUser.email === email) {
            this.currentUser = userData;
            localStorage.setItem('eRecycleCurrentUser', JSON.stringify(this.currentUser));
            this.updateUserInfo();
        }
        
        this.showNotification('Berhasil', 'Data pengguna berhasil disimpan', 'success');
        this.hideUserModal();
        this.loadUsersTable();
    }
    
    editUser(email) {
        const user = this.users[email];
        if (user) {
            this.showUserModal(user);
        }
    }
    
    deleteUser(email) {
        if (email === this.currentUser.email) {
            this.showNotification('Error', 'Tidak dapat menghapus akun sendiri', 'error');
            return;
        }
        
        if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${email}?`)) {
            delete this.users[email];
            localStorage.setItem('eRecycleUsers', JSON.stringify(this.users));
            
            this.showNotification('Berhasil', 'Pengguna berhasil dihapus', 'success');
            this.loadUsersTable();
        }
    }
    
    loadLocationsData() {
        this.loadLocationsTable();
    }
    
    loadLocationsTable() {
        const tbody = document.querySelector('#locationsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const pengepulList = Object.values(this.users).filter(u => u.role === 'pengepul');
        
        pengepulList.forEach(pengepul => {
            const capacity = pengepul.capacity || 0;
            const currentLoad = pengepul.currentLoad || 0;
            const percentage = capacity > 0 ? Math.round((currentLoad / capacity) * 100) : 0;
            const status = percentage >= 90 ? 'Penuh' : percentage >= 70 ? 'Hampir Penuh' : 'Tersedia';
            const statusClass = percentage >= 90 ? 'full' : percentage >= 70 ? 'warning' : 'active';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pengepul.name}</td>
                <td>${pengepul.address || '-'}</td>
                <td>${pengepul.location ? `${pengepul.location.lat.toFixed(6)}, ${pengepul.location.lng.toFixed(6)}` : '-'}</td>
                <td>${capacity} kg</td>
                <td>${currentLoad} kg (${percentage}%)</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-view" data-email="${pengepul.email}">
                        <i class="fas fa-eye"></i> Lihat
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    loadTransactionsData() {
        this.loadTransactionsTable();
    }
    
    loadTransactionsTable() {
        const tbody = document.querySelector('#transactionsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Collect all transactions from all users
        let allTransactions = [];
        Object.values(this.users).forEach(user => {
            if (user.transactions) {
                user.transactions.forEach(transaction => {
                    allTransactions.push({
                        ...transaction,
                        userName: user.name,
                        userEmail: user.email,
                        userRole: user.role
                    });
                });
            }
        });
        
        // Sort by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Display transactions
        allTransactions.forEach((transaction, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>TRX-${String(index + 1).padStart(4, '0')}</td>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.userName}</td>
                <td>${transaction.collector || '-'}</td>
                <td>${this.getWasteTypeName(transaction.type)}</td>
                <td>${transaction.weight} kg</td>
                <td>${formatCurrency(transaction.value || 0)}</td>
                <td><span class="status-badge ${transaction.status || 'completed'}">${this.getStatusName(transaction.status)}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    getWasteTypeName(type) {
        const types = {
            'plastic_pet': 'Plastik PET',
            'plastic_hdpe': 'Plastik HDPE',
            'paper_newspaper': 'Kertas Koran',
            'paper_cardboard': 'Kardus',
            'metal_aluminum': 'Kaleng Aluminium',
            'glass': 'Kaca',
            'organic': 'Organik'
        };
        return types[type] || type;
    }
    
    getStatusName(status) {
        const statuses = {
            'pending': 'Menunggu',
            'completed': 'Selesai',
            'cancelled': 'Dibatalkan',
            'scheduled': 'Dijadwalkan'
        };
        return statuses[status] || status;
    }
    
    loadReportsData() {
        // This would load report data
        console.log('Loading reports data...');
    }
    
    loadSettingsData() {
        // Load current settings
        const siteName = document.getElementById('siteName');
        const siteEmail = document.getElementById('siteEmail');
        const pointValue = document.getElementById('pointValue');
        const minWithdrawal = document.getElementById('minWithdrawal');
        
        if (siteName) siteName.value = 'E-Recycle';
        if (siteEmail) siteEmail.value = 'contact@gmail.com';
        if (pointValue) pointValue.value = '100';
        if (minWithdrawal) minWithdrawal.value = '50000';
    }
    
    saveSettings() {
        const siteName = document.getElementById('siteName').value;
        const siteEmail = document.getElementById('siteEmail').value;
        const pointValue = document.getElementById('pointValue').value;
        const minWithdrawal = document.getElementById('minWithdrawal').value;
        
        // Save settings to localStorage
        const settings = {
            siteName,
            siteEmail,
            pointValue: parseInt(pointValue),
            minWithdrawal: parseInt(minWithdrawal),
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('eRecycleSettings', JSON.stringify(settings));
        
        this.showNotification('Berhasil', 'Pengaturan berhasil disimpan', 'success');
    }
    
    showNotification(title, message, type = 'success') {
        // Create notification if not exists
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="notification-content">
                    <h4 id="notification-title">${title}</h4>
                    <p id="notification-message">${message}</p>
                </div>
                <button class="notification-close" id="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            `;
            document.body.appendChild(notification);
        }
        
        document.getElementById('notification-title').textContent = title;
        document.getElementById('notification-message').textContent = message;
        
        // Set icon based on type
        const icon = notification.querySelector('.notification-icon i');
        if (icon) {
            switch(type) {
                case 'success':
                    icon.className = 'fas fa-check-circle';
                    break;
                case 'error':
                    icon.className = 'fas fa-exclamation-circle';
                    break;
                case 'warning':
                    icon.className = 'fas fa-exclamation-triangle';
                    break;
                case 'info':
                    icon.className = 'fas fa-info-circle';
                    break;
            }
        }
        
        // Set border color
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        notification.style.borderLeftColor = colors[type] || colors.success;
        
        notification.style.display = 'flex';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.style.display = 'none';
        }, 5000);
        
        // Close button
        document.getElementById('notification-close').onclick = () => {
            notification.style.display = 'none';
        };
    }
}

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});