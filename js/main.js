// Main Navigation System - FIXED VERSION
class NavigationSystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }
    
    init() {
        this.setupSidebarToggle();
        this.setupPageNavigation();
        this.setupLogout();
        this.checkAuth();
        this.updateActivePage();
    }
    
    checkAuth() {
        const currentUser = JSON.parse(localStorage.getItem('eRecycleCurrentUser'));
        const currentPage = window.location.pathname;
        
        // Jika di dashboard tapi belum login, redirect ke login
        if ((currentPage.includes('dashboard') || 
             currentPage.includes('admin') || 
             currentPage.includes('masyarakat') || 
             currentPage.includes('pengepul')) && 
            !currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        // Jika sudah login tapi di halaman login, redirect ke dashboard
        if (currentPage.includes('index.html') && currentUser) {
            this.redirectToDashboard(currentUser.role);
        }
        
        // Check role access
        if (currentUser) {
            const role = currentUser.role;
            if (currentPage.includes('admin-dashboard') && role !== 'admin') {
                window.location.href = 'index.html';
            } else if (currentPage.includes('masyarakat-dashboard') && role !== 'masyarakat') {
                window.location.href = 'index.html';
            } else if (currentPage.includes('pengepul-dashboard') && role !== 'pengepul') {
                window.location.href = 'index.html';
            }
        }
    }
    
    setupSidebarToggle() {
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.add('active');
                if (sidebarOverlay) sidebarOverlay.classList.add('active');
            });
            
            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', () => {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                });
            }
        }
    }
    
    setupPageNavigation() {
        const navLinks = document.querySelectorAll('.sidebar-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const pageId = link.getAttribute('data-page');
                if (!pageId) return;
                
                // Update active menu
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Show the page
                this.showPage(pageId);
                
                // Update current page
                this.currentPage = pageId;
                
                // Update URL hash
                window.location.hash = pageId;
            });
        });
        
        // Load page from URL hash on page load
        this.loadPageFromHash();
    }
    
    loadPageFromHash() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            const targetLink = document.querySelector(`.sidebar-link[data-page="${hash}"]`);
            if (targetLink) {
                // Update active menu
                document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
                targetLink.classList.add('active');
                
                // Show the page
                this.showPage(hash);
                this.currentPage = hash;
            }
        } else {
            // Default to dashboard
            this.showPage('dashboard');
        }
    }
    
    showPage(pageId) {
        const pages = document.querySelectorAll('.page');
        const targetPage = document.getElementById(`${pageId}-page`);
        
        if (!targetPage) {
            console.error(`Page with id ${pageId}-page not found`);
            return;
        }
        
        // Hide all pages
        pages.forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        targetPage.classList.add('active');
        
        // Close mobile sidebar
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        }
        
        // Trigger page-specific load
        this.triggerPageLoad(pageId);
    }
    
    triggerPageLoad(pageId) {
        // Dispatch custom event for page load
        const event = new CustomEvent('pageLoad', { 
            detail: { 
                pageId: pageId,
                timestamp: new Date().getTime()
            }
        });
        document.dispatchEvent(event);
    }
    
    updateActivePage() {
        // Set initial active page
        setTimeout(() => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                this.showPage(hash);
            } else {
                this.showPage('dashboard');
            }
        }, 100);
    }
    
    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }
    
    logout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            localStorage.removeItem('eRecycleCurrentUser');
            window.location.href = 'index.html';
        }
    }
    
    redirectToDashboard(role) {
        switch(role) {
            case 'admin':
                window.location.href = 'admin-dashboard.html';
                break;
            case 'pengepul':
                window.location.href = 'pengepul-dashboard.html';
                break;
            case 'masyarakat':
                window.location.href = 'masyarakat-dashboard.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }
    
    // Utility functions
    static formatCurrency(amount) {
        if (!amount) return 'Rp 0';
        return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
    }
    
    static formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }
    
    static showLoading() {
        // Create loading overlay if not exists
        let loading = document.getElementById('loadingOverlay');
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loadingOverlay';
            loading.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-recycle fa-spin"></i>
                    <p>Memuat...</p>
                </div>
            `;
            document.body.appendChild(loading);
        }
        loading.style.display = 'flex';
    }
    
    static hideLoading() {
        const loading = document.getElementById('loadingOverlay');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Initialize navigation system
document.addEventListener('DOMContentLoaded', () => {
    // Add loading CSS
    const style = document.createElement('style');
    style.textContent = `
        #loadingOverlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            display: none;
        }
        .loading-spinner {
            text-align: center;
        }
        .loading-spinner i {
            font-size: 3rem;
            color: var(--primary-green);
            margin-bottom: 1rem;
        }
        .loading-spinner p {
            color: var(--dark-green);
            font-weight: 500;
        }
    `;
    document.head.appendChild(style);
    
    window.navigationSystem = new NavigationSystem();
    window.formatCurrency = NavigationSystem.formatCurrency;
    window.formatDate = NavigationSystem.formatDate;
    window.showLoading = NavigationSystem.showLoading;
    window.hideLoading = NavigationSystem.hideLoading;
});