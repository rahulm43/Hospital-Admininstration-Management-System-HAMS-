// Appointments Module
const AppointmentsModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const html = `
      <div class="appointments">
        <div class="flex-between mb-3">
          <h2>Appointments</h2>
          <button class="btn btn-primary" id="addAppointmentBtn">Schedule Appointment</button>
        </div>

        <div class="card">
          <div class="form-group">
            <input type="text" id="searchAppointment" placeholder="Search appointment by patient or doctor...">
          </div>
        </div>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="appointmentsList">
              <tr><td colspan="6" class="text-center">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="appointmentsPagination"></div>
      </div>
    `;

    content.innerHTML = html;

    // Event listeners
    document.getElementById('addAppointmentBtn').addEventListener('click', () => this.openForm());
    document.getElementById('searchAppointment').addEventListener('input', (e) => this.loadAppointments(1, e.target.value));

    // Load initial data
    this.loadAppointments(1);
  },

  async loadAppointments(page = 1, search = '') {
    try {
      const response = await api.getAppointments(page, 10, search);
      this.renderAppointmentsList(response.data);
      this.renderPagination(response.pagination);
    } catch (error) {
      showNotification(`Error loading appointments: ${error.message}`, 'error');
    }
  },

  renderAppointmentsList(appointments) {
    const tbody = document.getElementById('appointmentsList');
    if (appointments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No appointments found</td></tr>';
      return;
    }

    tbody.innerHTML = appointments.map(apt => `
      <tr>
        <td>${apt.patient?.name || '-'}</td>
        <td>${apt.doctor?.name || '-'}</td>
        <td>${apt.appointmentType || '-'}</td>
        <td>${new Date(apt.slotStart).toLocaleString()}</td>
        <td><span class="badge badge-${apt.status?.toLowerCase() || 'default'}">${apt.status}</span></td>
        <td>
          <button class="btn btn-primary" onclick="AppointmentsModule.viewAppointment('${apt.id}')">View</button>
          <button class="btn btn-secondary" onclick="AppointmentsModule.editAppointment('${apt.id}')">Edit</button>
          <button class="btn btn-danger" onclick="AppointmentsModule.deleteAppointment('${apt.id}')">Cancel</button>
        </td>
      </tr>
    `).join('');
  },

  renderPagination(pagination) {
    const container = document.getElementById('appointmentsPagination');
    const buttons = [];
    
    for (let i = 1; i <= (pagination?.pages || 1); i++) {
      buttons.push(`
        <button ${i === (pagination?.page || 1) ? 'class="btn active"' : 'class="btn"'} 
                onclick="AppointmentsModule.loadAppointments(${i})">
          ${i}
        </button>
      `);
    }
    
    container.innerHTML = buttons.join('');
  },

  openForm(appointmentId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    modalTitle.textContent = appointmentId ? 'Edit Appointment' : 'Schedule New Appointment';
    
    const html = `
      <form id="appointmentForm">
        <div class="form-group">
          <label>Patient</label>
          <select id="patientSelect" required>
            <option value="">Select Patient...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Doctor</label>
          <select id="doctorSelect" required>
            <option value="">Select Doctor...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select id="appointmentType" required>
            <option value="CONSULTATION">Consultation</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="PROCEDURE">Procedure</option>
            <option value="CHECKUP">Checkup</option>
          </select>
        </div>
        <div class="form-group">
          <label>Date & Time</label>
          <input type="datetime-local" id="slotStart" required>
        </div>
        <div class="form-group">
          <label>Duration (minutes)</label>
          <input type="number" id="duration" value="60" required>
        </div>
        <div class="form-group">
          <label>Reason</label>
          <textarea id="reason" placeholder="Reason for appointment"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Save Appointment</button>
      </form>
    `;
    
    modalBody.innerHTML = html;
    
    // Load dropdowns
    this.loadPatientOptions();
    this.loadDoctorOptions();
    
    // Load existing appointment if editing
    if (appointmentId) {
      this.loadAppointmentData(appointmentId);
    }
    
    // Handle form submit
    document.getElementById('appointmentForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAppointment(appointmentId);
    });
    
    modal.classList.remove('hidden');
  },

  async loadPatientOptions() {
    try {
      const response = await api.getPatients(1, 100);
      const select = document.getElementById('patientSelect');
      response.data.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = patient.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  },

  async loadDoctorOptions() {
    try {
      const response = await api.getStaff(1, 100);
      const select = document.getElementById('doctorSelect');
      response.data.filter(staff => staff.role === 'DOCTOR').forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = doctor.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading doctors:', error);
    }
  },

  async loadAppointmentData(appointmentId) {
    try {
      const response = await api.getAppointmentById(appointmentId);
      const apt = response.data;
      document.getElementById('patientSelect').value = apt.patientId;
      document.getElementById('doctorSelect').value = apt.doctorId;
      document.getElementById('appointmentType').value = apt.appointmentType;
      document.getElementById('slotStart').value = new Date(apt.slotStart).toISOString().slice(0, 16);
      document.getElementById('reason').value = apt.reason || '';
    } catch (error) {
      showNotification(`Error loading appointment: ${error.message}`, 'error');
    }
  },

  async saveAppointment(appointmentId = null) {
    try {
      const slotStart = document.getElementById('slotStart').value;
      const duration = parseInt(document.getElementById('duration').value) || 60;
      
      // Calculate slotEnd based on slotStart and duration
      const startDate = new Date(slotStart);
      const endDate = new Date(startDate.getTime() + duration * 60000); // Convert minutes to milliseconds
      
      const data = {
        patientId: document.getElementById('patientSelect').value,
        doctorId: document.getElementById('doctorSelect').value,
        appointmentType: document.getElementById('appointmentType').value,
        slotStart: startDate.toISOString(),
        slotEnd: endDate.toISOString(),
        reason: document.getElementById('reason').value,
      };

      if (appointmentId) {
        await api.updateAppointment(appointmentId, data);
        showNotification('Appointment updated successfully!', 'success');
      } else {
        await api.createAppointment(data);
        showNotification('Appointment scheduled successfully!', 'success');
      }

      document.getElementById('modal').classList.add('hidden');
      this.loadAppointments(1);
    } catch (error) {
      showNotification(`Error saving appointment: ${error.message}`, 'error');
    }
  },

  async viewAppointment(appointmentId) {
    try {
      const response = await api.getAppointmentById(appointmentId);
      const apt = response.data;
      
      const modal = document.getElementById('modal');
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      
      modalTitle.textContent = 'Appointment Details';
      modalBody.innerHTML = `
        <div class="details">
          <p><strong>Patient:</strong> ${apt.patient?.name}</p>
          <p><strong>Doctor:</strong> ${apt.doctor?.name}</p>
          <p><strong>Type:</strong> ${apt.appointmentType}</p>
          <p><strong>Date & Time:</strong> ${new Date(apt.slotStart).toLocaleString()}</p>
          <p><strong>Status:</strong> ${apt.status}</p>
          <p><strong>Reason:</strong> ${apt.reason || '-'}</p>
        </div>
      `;
      modal.classList.remove('hidden');
    } catch (error) {
      showNotification(`Error loading appointment: ${error.message}`, 'error');
    }
  },

  async editAppointment(appointmentId) {
    this.openForm(appointmentId);
  },

  async deleteAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await api.deleteAppointment(appointmentId);
        showNotification('Appointment cancelled successfully!', 'success');
        this.loadAppointments(1);
      } catch (error) {
        showNotification(`Error cancelling appointment: ${error.message}`, 'error');
      }
    }
  }
};

// Wards Module
const WardsModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const html = `
      <div class="wards">
        <div class="flex-between mb-3">
          <h2>Wards & Beds</h2>
          <button class="btn btn-primary" id="addWardBtn">Add Ward</button>
        </div>

        <div class="card">
          <div class="form-group">
            <input type="text" id="searchWard" placeholder="Search ward by name...">
          </div>
        </div>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Ward Name</th>
                <th>Department</th>
                <th>Total Beds</th>
                <th>Occupied</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="wardsList">
              <tr><td colspan="6" class="text-center">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="wardsPagination"></div>
      </div>
    `;

    content.innerHTML = html;

    document.getElementById('addWardBtn').addEventListener('click', () => this.openForm());
    document.getElementById('searchWard').addEventListener('input', (e) => this.loadWards(1, e.target.value));

    this.loadWards(1);
  },

  async loadWards(page = 1, search = '') {
    try {
      const response = await api.getWards(page, 10, search);
      this.renderWardsList(response.data);
      this.renderPagination(response.pagination);
    } catch (error) {
      showNotification(`Error loading wards: ${error.message}`, 'error');
    }
  },

  renderWardsList(wards) {
    const tbody = document.getElementById('wardsList');
    if (wards.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No wards found</td></tr>';
      return;
    }

    tbody.innerHTML = wards.map(ward => `
      <tr>
        <td>${ward.wardName}</td>
        <td>${ward.department}</td>
        <td>${ward.totalBeds}</td>
        <td>${ward.occupiedBeds}</td>
        <td>${ward.totalBeds - (ward.occupiedBeds || 0)}</td>
        <td>
          <button class="btn btn-primary" onclick="WardsModule.viewWard('${ward.id}')">View</button>
          <button class="btn btn-secondary" onclick="WardsModule.editWard('${ward.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  },

  renderPagination(pagination) {
    const container = document.getElementById('wardsPagination');
    const buttons = [];
    
    for (let i = 1; i <= (pagination?.pages || 1); i++) {
      buttons.push(`
        <button ${i === (pagination?.page || 1) ? 'class="btn active"' : 'class="btn"'} 
                onclick="WardsModule.loadWards(${i})">
          ${i}
        </button>
      `);
    }
    
    container.innerHTML = buttons.join('');
  },

  openForm(wardId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    modalTitle.textContent = wardId ? 'Edit Ward' : 'Add New Ward';
    
    const html = `
      <form id="wardForm">
        <div class="form-group">
          <label>Ward Name</label>
          <input type="text" id="wardName" required>
        </div>
        <div class="form-group">
          <label>Department</label>
          <input type="text" id="department" required>
        </div>
        <div class="form-group">
          <label>Total Beds</label>
          <input type="number" id="totalBeds" required min="1">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="description" placeholder="Ward description"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Save Ward</button>
      </form>
    `;
    
    modalBody.innerHTML = html;
    
    if (wardId) {
      this.loadWardData(wardId);
    }
    
    document.getElementById('wardForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveWard(wardId);
    });
    
    modal.classList.remove('hidden');
  },

  async loadWardData(wardId) {
    try {
      const response = await api.getWardById(wardId);
      const ward = response.data;
      document.getElementById('wardName').value = ward.wardName;
      document.getElementById('department').value = ward.department;
      document.getElementById('totalBeds').value = ward.totalBeds;
      document.getElementById('description').value = ward.description || '';
    } catch (error) {
      showNotification(`Error loading ward: ${error.message}`, 'error');
    }
  },

  async saveWard(wardId = null) {
    try {
      const data = {
        wardName: document.getElementById('wardName').value,
        department: document.getElementById('department').value,
        totalBeds: parseInt(document.getElementById('totalBeds').value),
        description: document.getElementById('description').value,
      };

      if (wardId) {
        await api.updateWard(wardId, data);
        showNotification('Ward updated successfully!', 'success');
      } else {
        await api.createWard(data);
        showNotification('Ward created successfully!', 'success');
      }

      document.getElementById('modal').classList.add('hidden');
      this.loadWards(1);
    } catch (error) {
      showNotification(`Error saving ward: ${error.message}`, 'error');
    }
  },

  async viewWard(wardId) {
    try {
      const response = await api.getWardById(wardId);
      const ward = response.data;
      
      const modal = document.getElementById('modal');
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      
      modalTitle.textContent = 'Ward Details';
      modalBody.innerHTML = `
        <div class="details">
          <p><strong>Ward Name:</strong> ${ward.wardName}</p>
          <p><strong>Department:</strong> ${ward.department}</p>
          <p><strong>Total Beds:</strong> ${ward.totalBeds}</p>
          <p><strong>Occupied Beds:</strong> ${ward.occupiedBeds}</p>
          <p><strong>Available Beds:</strong> ${ward.totalBeds - (ward.occupiedBeds || 0)}</p>
          <p><strong>Description:</strong> ${ward.description || '-'}</p>
        </div>
      `;
      modal.classList.remove('hidden');
    } catch (error) {
      showNotification(`Error loading ward: ${error.message}`, 'error');
    }
  },

  editWard(wardId) {
    this.openForm(wardId);
  }
};

// Inventory Module
const InventoryModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const html = `
      <div class="inventory">
        <div class="flex-between mb-3">
          <h2>Inventory</h2>
          <button class="btn btn-primary" id="addInventoryBtn">Add Item</button>
        </div>

        <div class="card">
          <div class="form-group">
            <input type="text" id="searchInventory" placeholder="Search inventory by name...">
          </div>
        </div>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reorder Level</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="inventoryList">
              <tr><td colspan="6" class="text-center">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="inventoryPagination"></div>
      </div>
    `;

    content.innerHTML = html;

    document.getElementById('addInventoryBtn').addEventListener('click', () => this.openForm());
    document.getElementById('searchInventory').addEventListener('input', (e) => this.loadInventory(1, e.target.value));

    this.loadInventory(1);
  },

  async loadInventory(page = 1, search = '') {
    try {
      const response = await api.getInventory(page, 10, search);
      this.renderInventoryList(response.data);
      this.renderPagination(response.pagination);
    } catch (error) {
      showNotification(`Error loading inventory: ${error.message}`, 'error');
    }
  },

  renderInventoryList(items) {
    const tbody = document.getElementById('inventoryList');
    if (items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No items found</td></tr>';
      return;
    }

    tbody.innerHTML = items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.itemType}</td>
        <td>${item.quantity}</td>
        <td>${item.reorderLevel}</td>
        <td>${item.location || '-'}</td>
        <td>
          <button class="btn btn-secondary" onclick="InventoryModule.editItem('${item.id}')">Edit</button>
          <button class="btn btn-danger" onclick="InventoryModule.deleteItem('${item.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  },

  renderPagination(pagination) {
    const container = document.getElementById('inventoryPagination');
    const buttons = [];
    
    for (let i = 1; i <= (pagination?.pages || 1); i++) {
      buttons.push(`
        <button ${i === (pagination?.page || 1) ? 'class="btn active"' : 'class="btn"'} 
                onclick="InventoryModule.loadInventory(${i})">
          ${i}
        </button>
      `);
    }
    
    container.innerHTML = buttons.join('');
  },

  openForm(itemId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    modalTitle.textContent = itemId ? 'Edit Item' : 'Add New Item';
    
    const html = `
      <form id="inventoryForm">
        <div class="form-group">
          <label>Item Name</label>
          <input type="text" id="itemName" required>
        </div>
        <div class="form-group">
          <label>Type</label>
          <select id="itemType" required>
            <option value="MEDICINE">Medicine</option>
            <option value="SUPPLY">Supply</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
        </div>
        <div class="form-group">
          <label>Quantity</label>
          <input type="number" id="quantity" required min="0">
        </div>
        <div class="form-group">
          <label>Reorder Level</label>
          <input type="number" id="reorderLevel" required min="0">
        </div>
        <div class="form-group">
          <label>Unit</label>
          <input type="text" id="unit" placeholder="e.g., tablets, boxes, liters">
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="location" placeholder="Storage location">
        </div>
        <button type="submit" class="btn btn-primary">Save Item</button>
      </form>
    `;
    
    modalBody.innerHTML = html;
    
    if (itemId) {
      this.loadItemData(itemId);
    }
    
    document.getElementById('inventoryForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveItem(itemId);
    });
    
    modal.classList.remove('hidden');
  },

  async loadItemData(itemId) {
    try {
      const response = await api.getInventoryById(itemId);
      const item = response.data;
      document.getElementById('itemName').value = item.name;
      document.getElementById('itemType').value = item.itemType;
      document.getElementById('quantity').value = item.quantity;
      document.getElementById('reorderLevel').value = item.reorderLevel;
      document.getElementById('unit').value = item.unit || '';
      document.getElementById('location').value = item.location || '';
    } catch (error) {
      showNotification(`Error loading item: ${error.message}`, 'error');
    }
  },

  async saveItem(itemId = null) {
    try {
      const data = {
        name: document.getElementById('itemName').value,
        itemType: document.getElementById('itemType').value,
        quantity: parseInt(document.getElementById('quantity').value),
        reorderLevel: parseInt(document.getElementById('reorderLevel').value),
        unit: document.getElementById('unit').value,
        location: document.getElementById('location').value,
      };

      if (itemId) {
        await api.updateInventory(itemId, data);
        showNotification('Item updated successfully!', 'success');
      } else {
        await api.createInventory(data);
        showNotification('Item added successfully!', 'success');
      }

      document.getElementById('modal').classList.add('hidden');
      this.loadInventory(1);
    } catch (error) {
      showNotification(`Error saving item: ${error.message}`, 'error');
    }
  },

  async editItem(itemId) {
    this.openForm(itemId);
  },

  async deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await api.deleteInventory(itemId);
        showNotification('Item deleted successfully!', 'success');
        this.loadInventory(1);
      } catch (error) {
        showNotification(`Error deleting item: ${error.message}`, 'error');
      }
    }
  }
};

// Billing Module
const BillingModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const html = `
      <div class="billing">
        <div class="flex-between mb-3">
          <h2>Billing & Invoices</h2>
          <button class="btn btn-primary" id="addInvoiceBtn">Create Invoice</button>
        </div>

        <div class="card">
          <div class="form-group">
            <input type="text" id="searchInvoice" placeholder="Search invoice by number or patient...">
          </div>
        </div>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="invoicesList">
              <tr><td colspan="6" class="text-center">Loading...</td></tr>
            </tbody>
          </table>
        </div>

        <div class="pagination" id="invoicesPagination"></div>
      </div>
    `;

    content.innerHTML = html;

    document.getElementById('addInvoiceBtn').addEventListener('click', () => this.openForm());
    document.getElementById('searchInvoice').addEventListener('input', (e) => this.loadInvoices(1, e.target.value));

    this.loadInvoices(1);
  },

  async loadInvoices(page = 1, search = '') {
    try {
      const response = await api.getInvoices(page, 10, search);
      console.log('Invoices API response:', response);
      this.renderInvoicesList(response.data);
      this.renderPagination(response.pagination);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showNotification(`Error loading invoices: ${error.message}`, 'error');
    }
  },

  renderInvoicesList(invoices) {
    const tbody = document.getElementById('invoicesList');
    if (invoices.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No invoices found</td></tr>';
      return;
    }

    tbody.innerHTML = invoices.map(invoice => `
      <tr>
        <td>${invoice.invoiceNumber}</td>
        <td>${invoice.patient?.name || '-'}</td>
        <td>$${(parseFloat(invoice.totalAmount) || 0).toFixed(2)}</td>
        <td><span class="badge badge-${invoice.status?.toLowerCase() || 'default'}">${invoice.status || 'DRAFT'}</span></td>
        <td>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</td>
        <td>
          <button class="btn btn-primary" onclick="BillingModule.viewInvoice('${invoice.id}')">View</button>
          ${invoice.status !== 'PAID' ? `<button class="btn btn-success" onclick="BillingModule.markAsPaid('${invoice.id}')">Pay</button>` : ''}
          <button class="btn btn-secondary" onclick="BillingModule.editInvoice('${invoice.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  },

  renderPagination(pagination) {
    const container = document.getElementById('invoicesPagination');
    const buttons = [];
    
    for (let i = 1; i <= (pagination?.pages || 1); i++) {
      buttons.push(`
        <button ${i === (pagination?.page || 1) ? 'class="btn active"' : 'class="btn"'} 
                onclick="BillingModule.loadInvoices(${i})">
          ${i}
        </button>
      `);
    }
    
    container.innerHTML = buttons.join('');
  },

  openForm(invoiceId = null) {
    const modal = document.getElementById('modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalBody = document.querySelector('.modal-body');
    
    modalTitle.textContent = invoiceId ? 'Edit Invoice' : 'Create New Invoice';
    
    const html = `
      <form id="invoiceForm">
        <div class="form-group">
          <label>Patient</label>
          <select id="patientSelect" required>
            <option value="">Select Patient...</option>
          </select>
        </div>
        <div class="form-group">
          <label>Amount</label>
          <input type="number" id="totalAmount" step="0.01" required min="0">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="status" required>
            <option value="DRAFT">Draft</option>
            <option value="ISSUED">Issued</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
          </select>
        </div>
        <div class="form-group">
          <label>Due Date</label>
          <input type="date" id="dueDate" required>
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="paymentMethod">
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="INSURANCE">Insurance</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary">Save Invoice</button>
      </form>
    `;
    
    modalBody.innerHTML = html;
    
    this.loadPatientOptions();
    
    if (invoiceId) {
      this.loadInvoiceData(invoiceId);
    }
    
    document.getElementById('invoiceForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveInvoice(invoiceId);
    });
    
    modal.classList.remove('hidden');
  },

  async loadPatientOptions() {
    try {
      const response = await api.getPatients(1, 100);
      const select = document.getElementById('patientSelect');
      response.data.forEach(patient => {
        const option = document.createElement('option');
        option.value = patient.id;
        option.textContent = patient.name;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  },

  async loadInvoiceData(invoiceId) {
    try {
      const response = await api.getInvoiceById(invoiceId);
      const invoice = response.data;
      document.getElementById('patientSelect').value = invoice.patientId;
      document.getElementById('totalAmount').value = invoice.totalAmount;
      document.getElementById('status').value = invoice.status;
      document.getElementById('dueDate').value = new Date(invoice.dueDate).toISOString().split('T')[0];
      document.getElementById('paymentMethod').value = invoice.paymentMethod;
    } catch (error) {
      showNotification(`Error loading invoice: ${error.message}`, 'error');
    }
  },

  async saveInvoice(invoiceId = null) {
    try {
      const patientId = document.getElementById('patientSelect').value;
      const totalAmount = parseFloat(document.getElementById('totalAmount').value) || 0;
      const status = document.getElementById('status').value;
      const dueDate = document.getElementById('dueDate').value;
      const paymentMethod = document.getElementById('paymentMethod').value;
      
      console.log('Creating invoice with amount:', totalAmount);
      
      // Create a single line item for the total amount
      const lineItems = [{
        description: 'Medical Services',
        quantity: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount,
        category: 'MEDICAL_SERVICES'
      }];
      
      const data = {
        patientId,
        lineItems,
        taxPercent: 10, // 10% tax
        discountAmount: 0,
        dueDate,
        paymentMethod,
        status
      };

      console.log('Sending invoice data:', data);

      let response;
      if (invoiceId) {
        response = await api.updateInvoice(invoiceId, data);
        showNotification('Invoice updated successfully!', 'success');
      } else {
        response = await api.createInvoice(data);
        showNotification('Invoice created successfully!', 'success');
      }
      
      console.log('API response:', response);

      document.getElementById('modal').classList.add('hidden');
      this.loadInvoices(1);
    } catch (error) {
      console.error('Error saving invoice:', error);
      showNotification(`Error saving invoice: ${error.message}`, 'error');
    }
  },

  async viewInvoice(invoiceId) {
    try {
      const response = await api.getInvoiceById(invoiceId);
      const invoice = response.data;
      
      const modal = document.getElementById('modal');
      const modalTitle = document.querySelector('.modal-title');
      const modalBody = document.querySelector('.modal-body');
      
      modalTitle.textContent = 'Invoice Details';
      modalBody.innerHTML = `
        <div class="details">
          <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
          <p><strong>Patient:</strong> ${invoice.patient?.name || 'N/A'}</p>
          <p><strong>Subtotal:</strong> $${parseFloat(invoice.subtotal || 0).toFixed(2)}</p>
          <p><strong>Tax:</strong> $${parseFloat(invoice.taxAmount || 0).toFixed(2)}</p>
          ${invoice.discountAmount > 0 ? `<p><strong>Discount:</strong> $${parseFloat(invoice.discountAmount).toFixed(2)}</p>` : ''}
          <p><strong>Total:</strong> $${parseFloat(invoice.totalAmount || 0).toFixed(2)}</p>
          <p><strong>Status:</strong> ${invoice.status || 'N/A'}</p>
          <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
          ${invoice.paidDate ? `<p><strong>Paid Date:</strong> ${new Date(invoice.paidDate).toLocaleDateString()}</p>` : ''}
          ${invoice.paymentMethod ? `<p><strong>Payment Method:</strong> ${invoice.paymentMethod}</p>` : ''}
        </div>
        
        <div style="margin: 15px 0;">
          ${invoice.status !== 'PAID' ? `
            <button class="btn btn-success" onclick="BillingModule.markAsPaid('${invoice.id}')">Mark as Paid</button>
          ` : ''}
          <button class="btn btn-secondary" onclick="BillingModule.editInvoice('${invoice.id}')">Edit Invoice</button>
        </div>
        
        ${invoice.lineItems && invoice.lineItems.length > 0 ? `
        <div style="margin-top: 20px;">
          <h4>Line Items</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.lineItems.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td>$${parseFloat(item.totalPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      `;
      modal.classList.remove('hidden');
    } catch (error) {
      showNotification(`Error loading invoice: ${error.message}`, 'error');
    }
  },
  
  async markAsPaid(invoiceId) {
    try {
      // Get current date as paid date in ISO format
      const paidDate = new Date().toISOString();
      
      // Update invoice status to PAID with payment method CASH and paid date
      await api.updateInvoice(invoiceId, {
        status: 'PAID',
        paymentMethod: 'CASH',
        paidDate: paidDate
      });
      
      showNotification('Invoice marked as paid successfully!', 'success');
      
      // Close modal and refresh invoice list
      document.getElementById('modal').classList.add('hidden');
      this.loadInvoices(1);
    } catch (error) {
      showNotification(`Error marking invoice as paid: ${error.message}`, 'error');
    }
  },

  editInvoice(invoiceId) {
    this.openForm(invoiceId);
  }
};
