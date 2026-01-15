// Pengepul Dashboard Functionality
class PengepulDashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('eRecycleCurrentUser'));
        this.users = JSON.parse(localStorage.getItem('eRecycleUsers')) || {};
        this.init();
    }
    
    init() {
        if (!this.currentUser || this.currentUser.role !== 'pengepul') {
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
        document.getElementById('pengepulName').textContent = this.currentUser.name;
        const capacity = this.currentUser.capacity || 0;
        const currentLoad = this.currentUser.currentLoad || 0;
        document.getElementById('pengepulCapacity').textContent = `Kapasitas: ${currentLoad}/${capacity} kg`;
    }
    
    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
        });
        
        // Weighing form
        document.getElementById('weighingForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTransaction();
        });
        
        // Waste type change
        document.getElementById('wasteType')?.addEventListener('change', (e) => {
            this.calculateTransactionValue();
        });
        
        document.getElementById('weight')?.addEventListener('input', () => {
            this.calculateTransactionValue();
        });
    }
    
    loadDashboardData() {
        // Update stats
        const transactions = this.currentUser.transactions || [];
        const totalTransactions = transactions.length;
        
        let totalWaste = 0;
        let totalPoints = 0;
        
        transactions.forEach(t => {
            totalWaste += t.weight || 0;
            totalPoints += t.points || 0;
        });
        
        const capacity = this.currentUser.capacity || 0;
        const currentLoad = this.currentUser.currentLoad || 0;
        const available = capacity - currentLoad;
        
        document.getElementById('totalTransactionsPengepul').textContent = totalTransactions;
        document.getElementById('totalWasteCollected').textContent = `${totalWaste} kg`;
        document.getElementById('availableCapacity').textContent = `${available} kg`;
        document.getElementById('totalPointsGiven').textContent = totalPoints;
        
        // Load recent transactions
        this.loadRecentTransactions();
    }
    
    loadPageData(pageId) {
        switch(pageId) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'weighing':
                this.setupWeighingForm();
                break;
            case 'transactions':
                this.loadTransactionsData();
                break;
        }
    }
    
    loadRecentTransactions() {
        const tbody = document.querySelector('#recentTransactions tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const transactions = this.currentUser.transactions || [];
        
        transactions.slice(-5).reverse().forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.customerName || '-'}</td>
                <td>${transaction.type || '-'}</td>
                <td>${transaction.weight} kg</td>
                <td>${transaction.points || 0}</td>
                <td><span class="status-badge ${transaction.status || 'completed'}">Selesai</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    setupWeighingForm() {
        // Reset form
        document.getElementById('weighingForm').reset();
        this.calculateTransactionValue();
    }
    
    calculateTransactionValue() {
        const typeSelect = document.getElementById('wasteType');
        const weightInput = document.getElementById('weight');
        const priceInput = document.getElementById('pricePerKg');
        const totalInput = document.getElementById('totalValue');
        const pointsInput = document.getElementById('pointsEarned');
        
        if (!typeSelect.value || !weightInput.value) {
            priceInput.value = '';
            totalInput.value = '';
            pointsInput.value = '';
            return;
        }
        
        const price = parseInt(typeSelect.options[typeSelect.selectedIndex].getAttribute('data-price')) || 0;
        const weight = parseFloat(weightInput.value) || 0;
        const total = price * weight;
        const points = Math.floor(total / 100);
        
        priceInput.value = formatCurrency(price);
        totalInput.value = formatCurrency(total);
        pointsInput.value = points;
    }
    
    saveTransaction() {
        const customerName = document.getElementById('customerName').value;
        const wasteType = document.getElementById('wasteType').value;
        const weight = parseFloat(document.getElementById('weight').value) || 0;
        const price = parseInt(document.getElementById('wasteType').options[document.getElementById('wasteType').selectedIndex].getAttribute('data-price')) || 0;
        
        if (!customerName || !wasteType || !weight) {
            auth.showNotification('Error', 'Harap isi semua field wajib', 'error');
            return;
        }
        
        const transaction = {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString(),
            customerName,
            type: wasteType,
            weight,
            price,
            value: price * weight,
            points: Math.floor((price * weight) / 100),
            status: 'completed'
        };
        
        // Add to pengepul transactions
        if (!this.currentUser.transactions) {
            this.currentUser.transactions = [];
        }
        this.currentUser.transactions.push(transaction);
        
        // Update current load
        this.currentUser.currentLoad = (this.currentUser.currentLoad || 0) + weight;
        
        // Save to storage
        this.users[this.currentUser.email] = this.currentUser;
        localStorage.setItem('eRecycleUsers', JSON.stringify(this.users));
        localStorage.setItem('eRecycleCurrentUser', JSON.stringify(this.currentUser));
        
        auth.showNotification('Berhasil', 'Transaksi berhasil disimpan', 'success');
        document.getElementById('weighingForm').reset();
        this.updateUserInfo();
    }
    
    loadTransactionsData() {
        const tbody = document.querySelector('#allTransactionsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const transactions = this.currentUser.transactions || [];
        
        transactions.reverse().forEach((transaction, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.customerName || '-'}</td>
                <td>${transaction.type || '-'}</td>
                <td>${transaction.weight} kg</td>
                <td>${formatCurrency(transaction.price || 0)}</td>
                <td>${formatCurrency(transaction.value || 0)}</td>
                <td>${transaction.points || 0}</td>
                <td><span class="status-badge ${transaction.status || 'completed'}">Selesai</span></td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Initialize pengepul dashboard
document.addEventListener('DOMContentLoaded', () => {
    new PengepulDashboard();
});