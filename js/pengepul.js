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
        
        // Quick weigh button
        document.getElementById('quickWeighBtn')?.addEventListener('click', () => {
            this.navigateToPage('weighing');
        });
        
        // Add pickup button
        document.getElementById('addPickupBtn')?.addEventListener('click', () => {
            this.addNewPickup();
        });
        
        // Refresh today transactions
        document.getElementById('refreshTodayBtn')?.addEventListener('click', () => {
            this.loadTodayTransactions();
        });
        
        // Export transactions
        document.getElementById('exportTransactionsBtn')?.addEventListener('click', () => {
            this.exportTransactions();
        });
        
        // Update stock button
        document.getElementById('updateStockBtn')?.addEventListener('click', () => {
            this.updateStock();
        });
        
        // Generate report
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            this.generateReport();
        });
        
        // Profile form
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });
        
        // Conversion calculator
        document.getElementById('conversionWasteType')?.addEventListener('change', () => {
            this.calculateConversion();
        });
        
        document.getElementById('conversionWeight')?.addEventListener('input', () => {
            this.calculateConversion();
        });
        
        // Filter events
        document.getElementById('filterStatus')?.addEventListener('change', () => {
            this.filterPickups();
        });
        
        document.getElementById('searchPickup')?.addEventListener('input', () => {
            this.searchPickups();
        });
    }
    
    navigateToPage(pageId) {
        // Trigger page change event
        document.dispatchEvent(new CustomEvent('pageChanged', {
            detail: { pageId }
        }));
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
            case 'pickup':
                this.loadPickupData();
                break;
            case 'conversion':
                this.loadConversionData();
                break;
            case 'transactions':
                this.loadTransactionsData();
                break;
            case 'stock':
                this.loadStockData();
                break;
            case 'reports':
                this.setupReports();
                break;
            case 'profile':
                this.loadProfileData();
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
        this.loadTodayTransactions();
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
        const customerPhone = document.getElementById('customerPhone').value;
        const wasteType = document.getElementById('wasteType').value;
        const weight = parseFloat(document.getElementById('weight').value) || 0;
        const price = parseInt(document.getElementById('wasteType').options[document.getElementById('wasteType').selectedIndex].getAttribute('data-price')) || 0;
        const notes = document.getElementById('notes').value;
        
        if (!customerName || !wasteType || !weight) {
            auth.showNotification('Error', 'Harap isi semua field wajib', 'error');
            return;
        }
        
        const transaction = {
            id: `TRX-${Date.now()}`,
            date: new Date().toISOString(),
            customerName,
            customerPhone,
            type: wasteType,
            weight,
            price,
            value: price * weight,
            points: Math.floor((price * weight) / 100),
            status: 'completed',
            notes
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
        this.loadTodayTransactions();
        this.loadDashboardData();
    }
    
    loadTodayTransactions() {
        const tbody = document.querySelector('#todayTransactionsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const transactions = this.currentUser.transactions || [];
        
        const today = new Date().toDateString();
        const todayTransactions = transactions.filter(t => {
            const transDate = new Date(t.date).toDateString();
            return transDate === today;
        });
        
        todayTransactions.reverse().forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatTime(transaction.date)}</td>
                <td>${transaction.customerName || '-'}</td>
                <td>${transaction.type || '-'}</td>
                <td>${transaction.weight} kg</td>
                <td>${formatCurrency(transaction.value || 0)}</td>
                <td>${transaction.points || 0}</td>
                <td>
                    <button class="btn btn-sm btn-view view-transaction-btn" data-id="${transaction.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    loadPickupData() {
        this.loadPickupsTable();
    }
    
    loadPickupsTable() {
        const tbody = document.querySelector('#pickupsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Data dummy sederhana
        const dummyPickups = [
            {
                id: 'PICK-001',
                date: new Date().toISOString(),
                customerName: 'Budi Santoso',
                address: 'Jl. Merdeka No. 123, Yogyakarta',
                wasteType: 'Plastik & Kertas',
                estimatedWeight: '5 kg',
                status: 'pending'
            },
            {
                id: 'PICK-002',
                date: new Date(Date.now() - 86400000).toISOString(), // Kemarin
                customerName: 'Siti Aminah',
                address: 'Jl. Sudirman No. 45, Yogyakarta',
                wasteType: 'Kaleng & Kaca',
                estimatedWeight: '3 kg',
                status: 'scheduled'
            },
            {
                id: 'PICK-003',
                date: new Date(Date.now() - 172800000).toISOString(), // 2 hari lalu
                customerName: 'Ahmad Fauzi',
                address: 'Jl. Malioboro No. 78, Yogyakarta',
                wasteType: 'Kardus',
                estimatedWeight: '8 kg',
                status: 'completed'
            }
        ];
        
        dummyPickups.forEach((pickup, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${pickup.id}</td>
                <td>${formatDate(pickup.date)}</td>
                <td>${pickup.customerName}</td>
                <td>${pickup.address}</td>
                <td>${pickup.wasteType}</td>
                <td>${pickup.estimatedWeight}</td>
                <td><span class="status-badge ${pickup.status}">${this.getStatusText(pickup.status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-view view-pickup-btn" data-id="${pickup.id}">
                        <i class="fas fa-eye"></i> Lihat
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    addNewPickup() {
        auth.showNotification('Info', 'Fitur tambah penjemputan akan segera hadir!', 'info');
    }
    
    filterPickups() {
        const status = document.getElementById('filterStatus').value;
        // Filter logic sederhana
        const rows = document.querySelectorAll('#pickupsTable tbody tr');
        
        rows.forEach(row => {
            const statusCell = row.querySelector('.status-badge');
            if (status && statusCell) {
                const rowStatus = statusCell.classList.contains(status) ? status : '';
                row.style.display = rowStatus === status ? '' : 'none';
            } else {
                row.style.display = '';
            }
        });
    }
    
    searchPickups() {
        const searchTerm = document.getElementById('searchPickup').value.toLowerCase();
        const rows = document.querySelectorAll('#pickupsTable tbody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
    
    getStatusText(status) {
        const statusMap = {
            'pending': 'Menunggu',
            'scheduled': 'Dijadwalkan',
            'in_progress': 'Dalam Proses',
            'completed': 'Selesai',
            'cancelled': 'Dibatalkan'
        };
        return statusMap[status] || status;
    }
    
    loadConversionData() {
        this.calculateConversion();
    }
    
    calculateConversion() {
        const typeSelect = document.getElementById('conversionWasteType');
        const weightInput = document.getElementById('conversionWeight');
        const rupiahDisplay = document.getElementById('conversionRupiah');
        const pointsDisplay = document.getElementById('conversionPoints');
        
        if (!typeSelect.value || !weightInput.value) {
            rupiahDisplay.textContent = 'Rp 0';
            pointsDisplay.textContent = '0 poin';
            return;
        }
        
        const price = parseInt(typeSelect.options[typeSelect.selectedIndex].getAttribute('data-price')) || 0;
        const weight = parseFloat(weightInput.value) || 0;
        const total = price * weight;
        const points = Math.floor(total / 100);
        
        rupiahDisplay.textContent = formatCurrency(total);
        pointsDisplay.textContent = `${points} poin`;
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
    
    exportTransactions() {
        auth.showNotification('Info', 'Fitur export data akan segera hadir!', 'info');
    }
    
    loadStockData() {
        // Update stock stats
        const transactions = this.currentUser.transactions || [];
        
        let plastic = 0;
        let paper = 0;
        let metal = 0;
        let glass = 0;
        
        transactions.forEach(t => {
            if (t.type.includes('plastic')) plastic += t.weight || 0;
            if (t.type.includes('paper')) paper += t.weight || 0;
            if (t.type.includes('metal')) metal += t.weight || 0;
            if (t.type.includes('glass')) glass += t.weight || 0;
        });
        
        document.getElementById('stockPlastic').textContent = `${plastic} kg`;
        document.getElementById('stockPaper').textContent = `${paper} kg`;
        document.getElementById('stockMetal').textContent = `${metal} kg`;
        document.getElementById('stockGlass').textContent = `${glass} kg`;
        
        // Load stock detail table
        this.loadStockDetailTable();
    }
    
    loadStockDetailTable() {
        const tbody = document.querySelector('#stockDetailTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        const stockData = [
            { type: 'Plastik PET', stock: 25, buyPrice: 4500, sellPrice: 5500, change: '+5%' },
            { type: 'Plastik HDPE', stock: 18, buyPrice: 3500, sellPrice: 4500, change: '+3%' },
            { type: 'Kertas Koran', stock: 32, buyPrice: 3200, sellPrice: 4000, change: '+7%' },
            { type: 'Kardus', stock: 45, buyPrice: 2800, sellPrice: 3500, change: '+2%' },
            { type: 'Kaleng Aluminium', stock: 12, buyPrice: 12000, sellPrice: 15000, change: '+10%' },
            { type: 'Kaca', stock: 8, buyPrice: 1500, sellPrice: 2000, change: '-1%' }
        ];
        
        stockData.forEach(item => {
            const row = document.createElement('tr');
            const stockValue = item.stock * item.buyPrice;
            row.innerHTML = `
                <td>${item.type}</td>
                <td>${item.stock} kg</td>
                <td>${formatCurrency(item.buyPrice)}</td>
                <td>${formatCurrency(item.sellPrice)}</td>
                <td>${formatCurrency(stockValue)}</td>
                <td><span class="${item.change.startsWith('+') ? 'positive' : 'negative'}">${item.change}</span></td>
            `;
            tbody.appendChild(row);
        });
    }
    
    updateStock() {
        auth.showNotification('Info', 'Stok berhasil diperbarui!', 'success');
        this.loadStockData();
    }
    
    setupReports() {
        // Setup report controls
        const reportDate = document.getElementById('reportDate');
        if (reportDate) {
            reportDate.value = new Date().toISOString().split('T')[0];
        }
    }
    
    generateReport() {
        const reportType = document.getElementById('reportType').value;
        const reportDate = document.getElementById('reportDate').value;
        
        if (!reportDate) {
            auth.showNotification('Error', 'Pilih tanggal terlebih dahulu', 'error');
            return;
        }
        
        const reportContent = document.getElementById('reportContent');
        reportContent.innerHTML = `
            <h4>Laporan ${reportType === 'daily' ? 'Harian' : reportType === 'weekly' ? 'Mingguan' : 'Bulanan'}</h4>
            <p>Tanggal: ${formatDate(reportDate)}</p>
            <div class="report-summary">
                <p>• Total Transaksi: ${this.currentUser.transactions?.length || 0}</p>
                <p>• Total Sampah Terkumpul: ${this.calculateTotalWaste()} kg</p>
                <p>• Total Poin Diberikan: ${this.calculateTotalPoints()}</p>
                <p>• Total Nilai Transaksi: ${formatCurrency(this.calculateTotalValue())}</p>
            </div>
            <p class="report-note"><i>Laporan ini dihasilkan secara otomatis berdasarkan data transaksi.</i></p>
        `;
        
        auth.showNotification('Berhasil', 'Laporan berhasil digenerate', 'success');
    }
    
    calculateTotalWaste() {
        const transactions = this.currentUser.transactions || [];
        return transactions.reduce((total, t) => total + (t.weight || 0), 0);
    }
    
    calculateTotalPoints() {
        const transactions = this.currentUser.transactions || [];
        return transactions.reduce((total, t) => total + (t.points || 0), 0);
    }
    
    calculateTotalValue() {
        const transactions = this.currentUser.transactions || [];
        return transactions.reduce((total, t) => total + (t.value || 0), 0);
    }
    
    loadProfileData() {
        // Load profile data into form
        document.getElementById('profileName').value = this.currentUser.name || '';
        document.getElementById('profileEmail').value = this.currentUser.email || '';
        document.getElementById('profilePhone').value = this.currentUser.phone || '';
        document.getElementById('profileAddress').value = this.currentUser.address || '';
        document.getElementById('profileCapacity').value = this.currentUser.capacity || 0;
        document.getElementById('profileLatitude').value = this.currentUser.lat || '';
        document.getElementById('profileLongitude').value = this.currentUser.lng || '';
        document.getElementById('profileDescription').value = this.currentUser.description || '';
    }
    
    saveProfile() {
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;
        const phone = document.getElementById('profilePhone').value;
        const address = document.getElementById('profileAddress').value;
        const capacity = document.getElementById('profileCapacity').value;
        const lat = document.getElementById('profileLatitude').value;
        const lng = document.getElementById('profileLongitude').value;
        const description = document.getElementById('profileDescription').value;
        
        if (!name || !email || !phone || !address || !capacity) {
            auth.showNotification('Error', 'Harap isi semua field wajib', 'error');
            return;
        }
        
        // Update current user
        this.currentUser.name = name;
        this.currentUser.email = email;
        this.currentUser.phone = phone;
        this.currentUser.address = address;
        this.currentUser.capacity = parseInt(capacity);
        this.currentUser.lat = lat;
        this.currentUser.lng = lng;
        this.currentUser.description = description;
        
        // Update in users data
        this.users[this.currentUser.email] = this.currentUser;
        localStorage.setItem('eRecycleUsers', JSON.stringify(this.users));
        localStorage.setItem('eRecycleCurrentUser', JSON.stringify(this.currentUser));
        
        this.updateUserInfo();
        auth.showNotification('Berhasil', 'Profil berhasil diperbarui', 'success');
    }
}

// Initialize pengepul dashboard
document.addEventListener('DOMContentLoaded', () => {
    new PengepulDashboard();
});

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}