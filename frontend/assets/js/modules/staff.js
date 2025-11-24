// Staff Module - User Management
const StaffModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const html = `
      <div class="staff">
        <div class="flex-between mb-3">
          <h2>Staff Management</h2>
          <button class="btn btn-primary" id="addStaffBtn">Add Staff Member</button>
        </div>

        <div class="card">
          <div class="form-group">
            <input type="text" id="searchStaff" placeholder="Search staff by name or email...">
          </div>
        </div>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="staffList">
              <tr><td colspan="6" class="text-center">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="staffPagination"></div>
      </div>
    `;

    content.innerHTML = html;

    document.getElementById('addStaffBtn').addEventListener('click', () => this.openForm());
    document.getElementById('searchStaff').addEventListener('input', (e) => this.loadStaff(1, e.target.value));

    this.loadStaff(1);
  },

  async loadStaff(page = 1, search = '') {
    try {
      const response = await api.getStaff(page, 10, search);
      this.renderStaffList(response.data);
      this.renderPagination(response.pagination);
    } catch (error) {
      showNotification(`Error loading staff: ${error.message}`, 'error');
    }
  },

  renderStaffList(staff) {
    const tbody = document.getElementById('staffList');
    if (!staff || staff.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No staff found</td></tr>';
      return;
    }

    tbody.innerHTML = staff.map(member => `
      <tr>
        <td>${member.name}</td>
        <td>${member.email}</td>
        <td>${member.role}</td>
        <td>${member.department || '-'}</td>
        <td><span class="badge badge-${member.status ? member.status.toLowerCase() : 'default'}">${member.status || 'ACTIVE'}</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="StaffModule.viewStaff('${member.id}')">View</button>
          <button class="btn btn-sm btn-secondary" onclick="StaffModule.editStaff('${member.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  },

  renderPagination(pagination) {
    const container = document.getElementById('staffPagination');
    if (!pagination) {
      container.innerHTML = '';
      return;
    }

    const buttons = [];
    for (let i = 1; i <= (pagination.pages || 1); i++) {
      buttons.push(`
        <button ${i === (pagination.page || 1) ? 'class="btn active"' : 'class="btn"'} 
                onclick="StaffModule.loadStaff(${i})">
          ${i}
        </button>
      `);
    }
    
    container.innerHTML = buttons.join('');
  },

  openForm(staffId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    modalTitle.textContent = staffId ? 'Edit Staff Member' : 'Add New Staff Member';
    
    const html = `
      <form id="staffForm">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="staffName" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="staffEmail" required>
        </div>
        <div class="form-group">
          <label>Role</label>
          <select id="staffRole" required>
            <option value="">Select Role</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE">Nurse</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="ADMIN">Admin</option>
            <option value="LAB_TECHNICIAN">Lab Technician</option>
            <option value="ACCOUNTANT">Accountant</option>
          </select>
        </div>
        <div class="form-group">
          <label>Department</label>
          <input type="text" id="staffDept" placeholder="e.g., Cardiology, General">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="staffStatus" required>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
        ${!staffId ? `
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="staffPassword" placeholder="Temporary password" required>
        </div>
        ` : ''}
        <button type="submit" class="btn btn-primary">Save Staff Member</button>
      </form>
    `;
    
    modalBody.innerHTML = html;
    
    if (staffId) {
      this.loadStaffData(staffId);
    }
    
    document.getElementById('staffForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveStaff(staffId);
    });
    
    modal.classList.remove('hidden');
  },

  async loadStaffData(staffId) {
    try {
      const response = await api.getStaffById(staffId);
      const staff = response.data;
      document.getElementById('staffName').value = staff.name || '';
      document.getElementById('staffEmail').value = staff.email || '';
      document.getElementById('staffRole').value = staff.role || '';
      document.getElementById('staffDept').value = staff.department || '';
      document.getElementById('staffStatus').value = staff.status || 'ACTIVE';
    } catch (error) {
      showNotification(`Error loading staff: ${error.message}`, 'error');
    }
  },

  async saveStaff(staffId = null) {
    try {
      const data = {
        name: document.getElementById('staffName').value,
        email: document.getElementById('staffEmail').value,
        role: document.getElementById('staffRole').value,
        department: document.getElementById('staffDept').value,
        status: document.getElementById('staffStatus').value,
      };

      if (!staffId) {
        data.password = document.getElementById('staffPassword').value;
        if (!data.password) {
          showNotification('Password is required', 'error');
          return;
        }
      }

      if (staffId) {
        await api.updateStaff(staffId, data);
        showNotification('Staff member updated successfully!', 'success');
      } else {
        await api.createStaff(data);
        showNotification('Staff member created successfully!', 'success');
      }

      document.getElementById('modal').classList.add('hidden');
      this.loadStaff(1);
    } catch (error) {
      showNotification(`Error saving staff: ${error.message}`, 'error');
    }
  },

  async viewStaff(staffId) {
    try {
      const response = await api.getStaffById(staffId);
      const staff = response.data;
      
      const modal = document.getElementById('modal');
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      
      modalTitle.textContent = 'Staff Details';
      modalBody.innerHTML = `
        <div class="details">
          <p><strong>Name:</strong> ${staff.name}</p>
          <p><strong>Email:</strong> ${staff.email}</p>
          <p><strong>Role:</strong> ${staff.role}</p>
          <p><strong>Department:</strong> ${staff.department || '-'}</p>
          <p><strong>Status:</strong> ${staff.status}</p>
          <p><strong>Created:</strong> ${new Date(staff.createdAt).toLocaleDateString()}</p>
        </div>
      `;
      modal.classList.remove('hidden');
    } catch (error) {
      showNotification(`Error loading staff: ${error.message}`, 'error');
    }
  },

  editStaff(staffId) {
    this.openForm(staffId);
  }
};
