// Main application script
const modules = {
  dashboard: DashboardModule,
  patients: PatientsModule,
  appointments: AppointmentsModule,
  staff: StaffModule,
  wards: WardsModule,
  beds: BedsModule,
  inventory: InventoryModule,
  billing: BillingModule,
  reports: ReportsModule,
  settings: SettingsModule,
};

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');
  
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

// Navigation
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const pageName = e.target.dataset.page;
      
      // Update active nav
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      e.target.classList.add('active');
      
      // Render module
      if (modules[pageName]) {
        try {
          await modules[pageName].render();
        } catch (error) {
          console.error(`Error rendering ${pageName}:`, error);
          showNotification(`Error loading ${pageName} module: ${error.message}`, 'error');
        }
      }
    });
  });
});

// Modal close
document.addEventListener('DOMContentLoaded', () => {
  const modalClose = document.querySelector('.modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      document.getElementById('modal').classList.add('hidden');
    });
  }
});

// Logout
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api.logout();
      window.location.href = 'login.html';
    });
  }
});

// Load user info
function loadUserInfo() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userNameElement = document.getElementById('userName');
  if (userNameElement) {
    userNameElement.textContent = `Welcome, ${user.name || 'User'}`;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Bypass authentication check and go directly to dashboard
    // Set a mock user for demonstration purposes
    const mockUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@hospital.com',
      role: 'ADMIN'
    };
    
    // For now, let's store mock user data in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('authToken', 'mock-auth-token');
    
    // Load user info and render dashboard
    loadUserInfo();
    
    // Render the dashboard module
    if (typeof DashboardModule !== 'undefined' && typeof DashboardModule.render === 'function') {
      await DashboardModule.render();
    } else {
      console.error('DashboardModule is not properly defined');
      showNotification('Error: Dashboard module not found', 'error');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
    showNotification(`Initialization error: ${error.message}`, 'error');
  }
});