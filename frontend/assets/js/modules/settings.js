// Settings Module - System Configuration and Account Settings
const SettingsModule = {
  async render() {
    const content = document.getElementById('pageContent');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    const html = `
      <div class="settings">
        <h2>Settings</h2>
        
        <div class="card">
          <h3>Account Settings</h3>
          <div class="form-group">
            <label>Name</label>
            <input type="text" value="${currentUser.name || ''}" disabled>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" value="${currentUser.email || ''}" disabled>
          </div>
          <div class="form-group">
            <label>Role</label>
            <input type="text" value="${currentUser.role || ''}" disabled>
          </div>
          <hr>
          <h4>Change Password</h4>
          <form id="passwordForm">
            <div class="form-group">
              <label>Current Password</label>
              <input type="password" id="currentPassword" required>
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="newPassword" required>
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <input type="password" id="confirmPassword" required>
            </div>
            <button type="submit" class="btn btn-primary">Update Password</button>
          </form>
        </div>

        <div class="card">
          <h3>System Settings</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4>Application Info</h4>
              <p><strong>System Name:</strong> Hospital Admin System</p>
              <p><strong>API Version:</strong> 1.0.0</p>
              <p><strong>Frontend Version:</strong> 1.0.0</p>
            </div>
            <div>
              <h4>System Status</h4>
              <p><strong>Backend:</strong> <span class="badge badge-success">Running</span></p>
              <p><strong>Database:</strong> <span class="badge badge-success">Connected</span></p>
              <p><strong>Authentication:</strong> <span class="badge badge-success">Active</span></p>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Notifications</h3>
          <div class="form-group">
            <label>
              <input type="checkbox" id="emailNotifications" checked>
              Enable email notifications
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="pushNotifications" checked>
              Enable push notifications
            </label>
          </div>
        </div>

        <div class="card">
          <h3>Danger Zone</h3>
          <p class="text-muted">Irreversible actions</p>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-danger" onclick="SettingsModule.logout()">Logout</button>
            <button class="btn btn-danger" onclick="SettingsModule.confirmClearCache()">Clear Cache</button>
          </div>
        </div>
      </div>
    `;

    content.innerHTML = html;

    document.getElementById('passwordForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.changePassword();
    });

    // Load notification preferences
    const emailNotif = localStorage.getItem('emailNotifications') !== 'false';
    const pushNotif = localStorage.getItem('pushNotifications') !== 'false';
    document.getElementById('emailNotifications').checked = emailNotif;
    document.getElementById('pushNotifications').checked = pushNotif;

    document.getElementById('emailNotifications').addEventListener('change', (e) => {
      localStorage.setItem('emailNotifications', e.target.checked);
    });
    document.getElementById('pushNotifications').addEventListener('change', (e) => {
      localStorage.setItem('pushNotifications', e.target.checked);
    });
  },

  async changePassword() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    if (!current || !newPass || !confirm) {
      showNotification('All fields are required', 'error');
      return;
    }

    if (newPass.length < 6) {
      showNotification('New password must be at least 6 characters', 'error');
      return;
    }

    if (newPass !== confirm) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    try {
      // Call backend to change password
      const response = await fetch('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newPass
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }

      showNotification('Password changed successfully! Please login again.', 'success');
      document.getElementById('passwordForm').reset();
      
      setTimeout(() => {
        this.logout();
      }, 2000);
    } catch (error) {
      showNotification(`Error: ${error.message}`, 'error');
    }
  },

  confirmClearCache() {
    if (confirm('This will clear all cached data. Continue?')) {
      localStorage.clear();
      showNotification('Cache cleared. Redirecting to login...', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    }
  },

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      showNotification('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    }
  }
};
