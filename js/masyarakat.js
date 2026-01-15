// Masyarakat Dashboard Functionality
class MasyarakatDashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('eRecycleCurrentUser'));
        this.users = JSON.parse(localStorage.getItem('eRecycleUsers')) || {};
        this.init();
    }
    
    init() {
        if (!this.currentUser || this.currentUser.role !== 'masyarakat') {
            window.location.href = 'index.html';
            return;
        }
        
        this.updateUserInfo();
        this.setupEventListeners();
        this.loadDashboardData();
        
        // Listen for page changes
        document.addEventListener('pageChanged', (e) => {
            this.loadPageData(e.detail.pageId);
        });
    }
    
    updateUserInfo() {
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userBalance').textContent = `Saldo: ${formatCurrency(this.currentUser.balance || 0)}`;
        document.getElementById('userPointsValue').textContent = `${this.currentUser.points || 0} Poin`;
    }
    
    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
        });
        
        // Quick sell
        document.getElementById('quickSellBtn')?.addEventListener('click', () => {
            this.showSellModal();
        });
        
        // Close sell modal
        document.getElementById('closeSellModal')?.addEventListener('click', () => {
            this.hideSellModal();
        });
        
        // Calculate sell value
        document.getElementById('sellWeight')?.addEventListener('input', () => {
            this.calculateSellValue();
        });
        
        document.getElementById('sellWasteType')?.addEventListener('change', () => {
            this.calculateSellValue();
        });
        
        // Exchange points
        document.getElementById('exchangePoints')?.addEventListener('input', (e) => {
            const points = parseInt(e.target.value) || 0;
            document.getElementById('exchangeAmount').value = formatCurrency(points * 100);
        });
        
        document.getElementById('exchangeBtn')?.addEventListener('click', () => {
            this.exchangePoints();
        });
        
        // Schedule pickup
        document.getElementById('scheduleForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.schedulePickup();
        });
    }
    
    loadDashboardData() {
        // Update stats
        document.getElementById('userPoints').textContent = this.currentUser.points || 0;
        document.getElementById('currentBalance').textContent = formatCurrency(this.currentUser.balance || 0);
        
        let totalWaste = 0;
        let totalTransactions = 0;
        
        if (this.currentUser.transactions) {
            totalTransactions = this.currentUser.transactions.length;
            this.currentUser.transactions.forEach(t => {
                totalWaste += t.weight || 0;
            });
        }
        
        document.getElementById('totalWasteUser').textContent = `${totalWaste} kg`;
        document.getElementById('totalTransactionsUser').textContent = totalTransactions;
        
        // Load upcoming pickups
        this.loadUpcomingPickups();
    }
    
    loadPageData(pageId) {
        switch(pageId) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'maps':
                this.loadMapsData();
                break;
            case 'reward':
                this.loadRewardData();
                break;
            case 'transactions':
                this.loadTransactionsData();
                break;
            case 'schedule':
                this.loadScheduleData();
                break;
        }
    }
    
    loadUpcomingPickups() {
        const tbody = document.querySelector('#upcomingPickups tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const pickups = [
            { date: '2024-05-20', time: '10:00-12:00', collector: 'Bank Sampah UAD', type: 'Plastik & Kertas', status: 'confirmed' },
            { date: '2024-05-22', time: '13:00-15:00', collector: 'Pengepul Sejahtera', type: 'Kaleng', status: 'pending' }
        ];
        
        pickups.forEach(pickup => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(pickup.date)}</td>
                <td>${pickup.time}</td>
                <td>${pickup.collector}</td>
                <td>${pickup.type}</td>
                <td><span class="status-badge ${pickup.status}">${pickup.status === 'confirmed' ? 'Dikonfirmasi' : 'Menunggu'}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    loadMapsData() {
        // Load collectors for map
        this.loadCollectors();
    }
    
    loadRewardData() {
        // Update points display
        document.getElementById('userPointsValue').textContent = `${this.currentUser.points || 0} Poin`;
    }
    
    loadTransactionsData() {
        const tbody = document.querySelector('#userTransactionsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (this.currentUser.transactions && this.currentUser.transactions.length > 0) {
            this.currentUser.transactions.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDate(transaction.date)}</td>
                    <td>${transaction.collector || '-'}</td>
                    <td>${transaction.type || '-'}</td>
                    <td>${transaction.weight} kg</td>
                    <td>${transaction.points || 0}</td>
                    <td>${formatCurrency(transaction.value || 0)}</td>
                    <td><span class="status-badge ${transaction.status || 'completed'}">${transaction.status === 'pending' ? 'Menunggu' : 'Selesai'}</span></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    loadScheduleData() {
        this.loadCollectors();
    }
    
    loadCollectors() {
        const collectorSelect = document.getElementById('collectorSelect');
        const sellCollector = document.getElementById('sellCollector');
        
        if (!collectorSelect && !sellCollector) return;
        
        const pengepulList = Object.values(this.users).filter(u => u.role === 'pengepul');
        
        // Clear and add options
        [collectorSelect, sellCollector].forEach(select => {
            if (!select) return;
            select.innerHTML = '<option value="">Pilih Pengepul</option>';
            
            pengepulList.forEach(pengepul => {
                const option = document.createElement('option');
                option.value = pengepul.email;
                option.textContent = `${pengepul.name}`;
                select.appendChild(option);
            });
        });
    }
    
    showSellModal() {
        document.getElementById('sellWasteModal').style.display = 'flex';
        this.calculateSellValue();
    }
    
    hideSellModal() {
        document.getElementById('sellWasteModal').style.display = 'none';
        document.getElementById('sellWasteForm').reset();
    }
    
    calculateSellValue() {
        const typeSelect = document.getElementById('sellWasteType');
        const weightInput = document.getElementById('sellWeight');
        const valueInput = document.getElementById('estimatedValue');
        
        if (!typeSelect.value || !weightInput.value) {
            valueInput.value = '';
            return;
        }
        
        const price = parseInt(typeSelect.options[typeSelect.selectedIndex].getAttribute('data-price')) || 0;
        const weight = parseFloat(weightInput.value) || 0;
        const value = price * weight;
        const points = Math.floor(value / 100);
        
        valueInput.value = `${formatCurrency(value)} (${points} poin)`;
    }
    
    exchangePoints() {
        const pointsInput = document.getElementById('exchangePoints');
        const points = parseInt(pointsInput.value) || 0;
        
        if (points < 100) {
            auth.showNotification('Error', 'Minimal penukaran 100 poin', 'error');
            return;
        }
        
        if (points > (this.currentUser.points || 0)) {
            auth.showNotification('Error', 'Poin tidak mencukupi', 'error');
            return;
        }
        
        // Update user points and balance
        this.currentUser.points -= points;
        this.currentUser.balance = (this.currentUser.balance || 0) + (points * 100);
        
        // Update in users data
        this.users[this.currentUser.email] = this.currentUser;
        localStorage.setItem('eRecycleUsers', JSON.stringify(this.users));
        localStorage.setItem('eRecycleCurrentUser', JSON.stringify(this.currentUser));
        
        auth.showNotification('Berhasil', `${points} poin berhasil ditukar menjadi ${formatCurrency(points * 100)}`, 'success');
        this.updateUserInfo();
        pointsInput.value = '';
        document.getElementById('exchangeAmount').value = '';
    }
    
    schedulePickup() {
        const date = document.getElementById('pickupDate').value;
        const time = document.getElementById('pickupTime').value;
        const collector = document.getElementById('collectorSelect').value;
        
        if (!date || !time || !collector) {
            auth.showNotification('Error', 'Harap isi semua field', 'error');
            return;
        }
        
        auth.showNotification('Berhasil', 'Penjemputan berhasil dijadwalkan', 'success');
        document.getElementById('scheduleForm').reset();
    }
}

// Initialize masyarakat dashboard
document.addEventListener('DOMContentLoaded', () => {
    new MasyarakatDashboard();
});