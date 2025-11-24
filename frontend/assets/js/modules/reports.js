// Reports Module - Analytics and Statistics
const ReportsModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const html = `
      <div class="reports">
        <h2>Reports & Analytics</h2>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0;">
          <div class="card">
            <h3>Patient Statistics</h3>
            <p class="text-muted">Total patients, demographics, blood groups</p>
            <button class="btn btn-primary" onclick="ReportsModule.generatePatientReport()">Generate Report</button>
          </div>
          
          <div class="card">
            <h3>Appointment Analytics</h3>
            <p class="text-muted">Appointment status, doctor workload</p>
            <button class="btn btn-primary" onclick="ReportsModule.generateAppointmentReport()">Generate Report</button>
          </div>
          
          <div class="card">
            <h3>Ward Occupancy</h3>
            <p class="text-muted">Bed availability and occupancy rates</p>
            <button class="btn btn-primary" onclick="ReportsModule.generateWardReport()">Generate Report</button>
          </div>
          
          <div class="card">
            <h3>Inventory Status</h3>
            <p class="text-muted">Stock levels and reorder alerts</p>
            <button class="btn btn-primary" onclick="ReportsModule.generateInventoryReport()">Generate Report</button>
          </div>

          <div class="card">
            <h3>Financial Report</h3>
            <p class="text-muted">Revenue, pending payments, invoices</p>
            <button class="btn btn-primary" onclick="ReportsModule.generateBillingReport()">Generate Report</button>
          </div>

          <div class="card">
            <h3>Staff Report</h3>
            <p class="text-muted">Staff count by role and department</p>
            <button class="btn btn-primary" onclick="ReportsModule.generateStaffReport()">Generate Report</button>
          </div>
        </div>

        <div class="card" id="reportContent" style="display: none;">
          <div class="flex-between mb-3">
            <h3 id="reportTitle"></h3>
            <button class="btn btn-secondary" onclick="ReportsModule.clearReport()">Close</button>
          </div>
          <div id="reportData"></div>
        </div>
      </div>
    `;

    content.innerHTML = html;
  },

  async generatePatientReport() {
    try {
      const response = await api.getPatients(1, 1000);
      const patients = response.data || [];
      
      const container = document.getElementById('reportContent');
      const title = document.getElementById('reportTitle');
      const data = document.getElementById('reportData');
      
      const genderDist = {
        MALE: patients.filter(p => p.gender === 'MALE').length,
        FEMALE: patients.filter(p => p.gender === 'FEMALE').length,
        OTHER: patients.filter(p => p.gender === 'OTHER').length
      };

      const bloodGroups = [...new Set(patients.map(p => p.bloodGroup))].filter(bg => bg);
      const bloodGroupDist = bloodGroups.map(bg => ({
        group: bg,
        count: patients.filter(p => p.bloodGroup === bg).length
      }));
      
      title.textContent = 'Patient Statistics Report';
      data.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h4>Summary</h4>
            <p><strong>Total Patients:</strong> ${patients.length}</p>
            <p><strong>Average Age:</strong> ${this.calcAverageAge(patients).toFixed(1)} years</p>
          </div>
          <div>
            <h4>Gender Distribution</h4>
            <ul>
              <li>Male: ${genderDist.MALE}</li>
              <li>Female: ${genderDist.FEMALE}</li>
              <li>Other: ${genderDist.OTHER}</li>
            </ul>
          </div>
        </div>
        <div style="margin-top: 20px;">
          <h4>Blood Group Distribution</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Blood Group</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${bloodGroupDist.map(bg => `
                <tr>
                  <td>${bg.group}</td>
                  <td>${bg.count}</td>
                  <td>${((bg.count / patients.length) * 100).toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      showNotification(`Error generating report: ${error.message}`, 'error');
    }
  },

  async generateAppointmentReport() {
    try {
      const response = await api.getAppointments(1, 1000);
      const appointments = response.data || [];
      
      const container = document.getElementById('reportContent');
      const title = document.getElementById('reportTitle');
      const data = document.getElementById('reportData');
      
      const statusCounts = {};
      const doctorAppointments = {};

      appointments.forEach(apt => {
        statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
        const doctor = apt.doctor?.name || 'Unknown';
        doctorAppointments[doctor] = (doctorAppointments[doctor] || 0) + 1;
      });
      
      title.textContent = 'Appointment Analytics Report';
      data.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h4>Appointment Status</h4>
            <table class="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(statusCounts).map(([status, count]) => `
                  <tr>
                    <td>${status}</td>
                    <td>${count}</td>
                    <td>${((count / appointments.length) * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div>
            <h4>Doctor Workload</h4>
            <ul>
              ${Object.entries(doctorAppointments).map(([doctor, count]) => `
                <li>${doctor}: ${count} appointments</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
      
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      showNotification(`Error generating report: ${error.message}`, 'error');
    }
  },

  async generateWardReport() {
    try {
      const response = await api.getWards(1, 1000);
      const wards = response.data || [];
      
      const container = document.getElementById('reportContent');
      const title = document.getElementById('reportTitle');
      const data = document.getElementById('reportData');
      
      // Calculate totals
      let totalBeds = 0;
      let totalOccupied = 0;
      
      wards.forEach(ward => {
        totalBeds += ward.totalBeds || 0;
        totalOccupied += ward.occupiedBeds || 0;
      });
      
      const totalAvailable = totalBeds - totalOccupied;
      const overallOccupancyRate = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : 0;
      
      title.textContent = 'Ward Occupancy Report';
      data.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div class="card" style="text-align: center;">
            <p class="text-muted">Total Beds</p>
            <h3>${totalBeds}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Occupied</p>
            <h3 style="color: #f44336;">${totalOccupied}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Available</p>
            <h3 style="color: #4caf50;">${totalAvailable}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Occupancy Rate</p>
            <h3>${overallOccupancyRate}%</h3>
          </div>
        </div>
        
        <h4>Ward-wise Occupancy</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Ward Name</th>
              <th>Department</th>
              <th>Total Beds</th>
              <th>Occupied</th>
              <th>Available</th>
              <th>Occupancy Rate</th>
            </tr>
          </thead>
          <tbody>
            ${wards.map(ward => {
              const total = ward.totalBeds || 0;
              const occupied = ward.occupiedBeds || 0;
              const available = total - occupied;
              const occupancyRate = total > 0 ? ((occupied / total) * 100).toFixed(1) : 0;
              return `
                <tr>
                  <td>${ward.wardName}</td>
                  <td>${ward.department}</td>
                  <td>${total}</td>
                  <td>${occupied}</td>
                  <td>${available}</td>
                  <td>${occupancyRate}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
      
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      showNotification(`Error generating report: ${error.message}`, 'error');
    }
  },

  async generateInventoryReport() {
    try {
      const response = await api.getInventory(1, 1000);
      const items = response.data || [];
      
      const container = document.getElementById('reportContent');
      const title = document.getElementById('reportTitle');
      const data = document.getElementById('reportData');
      
      const lowStock = items.filter(item => item.quantity <= item.reorderLevel);
      const outOfStock = items.filter(item => item.quantity === 0);
      
      title.textContent = 'Inventory Status Report';
      data.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div class="card" style="text-align: center;">
            <p class="text-muted">Total Items</p>
            <h3>${items.length}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Low Stock</p>
            <h3 style="color: #ff9800;">${lowStock.length}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Out of Stock</p>
            <h3 style="color: #f44336;">${outOfStock.length}</h3>
          </div>
        </div>

        ${lowStock.length > 0 ? `
          <h4>Low Stock Items (Need Reorder)</h4>
          <table class="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>Current</th>
                <th>Reorder At</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${lowStock.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.itemType || '-'}</td>
                  <td>${item.quantity}</td>
                  <td>${item.reorderLevel}</td>
                  <td><span class="badge ${item.quantity === 0 ? 'badge-danger' : 'badge-warning'}">
                    ${item.quantity === 0 ? 'OUT OF STOCK' : 'LOW STOCK'}
                  </span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="text-success">All items have healthy stock levels!</p>'}
      `;
      
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      showNotification(`Error generating report: ${error.message}`, 'error');
    }
  },

  async generateBillingReport() {
    try {
      const response = await api.getInvoices(1, 1000);
      const invoices = response.data || [];
      
      console.log('All invoices:', invoices);
      
      const container = document.getElementById('reportContent');
      const title = document.getElementById('reportTitle');
      const data = document.getElementById('reportData');
      
      // Filter out any invoices with invalid data
      const validInvoices = invoices.filter(inv => inv.totalAmount !== null && inv.totalAmount !== undefined);
      
      console.log('Valid invoices:', validInvoices);
      
      const totalAmount = validInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
      const paidAmount = validInvoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
      const issuedAmount = validInvoices.filter(inv => inv.status === 'ISSUED').reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
      const pendingAmount = totalAmount - paidAmount;
      const overdue = validInvoices.filter(inv => inv.status === 'OVERDUE').length;
      
      console.log('Calculated amounts:', { totalAmount, paidAmount, issuedAmount, pendingAmount });
      
      title.textContent = 'Financial Report';
      data.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div class="card" style="text-align: center;">
            <p class="text-muted">Total Invoiced</p>
            <h3>$${totalAmount.toFixed(2)}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Paid</p>
            <h3 style="color: #4caf50;">$${paidAmount.toFixed(2)}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Issued</p>
            <h3 style="color: #2196f3;">$${issuedAmount.toFixed(2)}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Pending</p>
            <h3 style="color: #ff9800;">$${pendingAmount.toFixed(2)}</h3>
          </div>
          <div class="card" style="text-align: center;">
            <p class="text-muted">Overdue Invoices</p>
            <h3 style="color: #f44336;">${overdue}</h3>
          </div>
        </div>

        <h4>Invoice Status Breakdown</h4>
        <table class="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Count</th>
              <th>Total Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${this.getInvoiceStatusStats(validInvoices).map(stat => `
              <tr>
                <td>${stat.status}</td>
                <td>${stat.count}</td>
                <td>$${stat.amount.toFixed(2)}</td>
                <td>${stat.percentage.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${validInvoices.length === 0 ? '<p class="text-muted">No invoices found in the system.</p>' : ''}
      `;
      
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error generating billing report:', error);
      showNotification(`Error generating report: ${error.message}`, 'error');
    }
  },

  async generateStaffReport() {
    try {
      const response = await api.getStaff(1, 1000);
      const staff = response.data || [];
      
      const container = document.getElementById('reportContent');
      const title = document.getElementById('reportTitle');
      const data = document.getElementById('reportData');
      
      const roleCount = {};
      const deptCount = {};
      const statusCount = {};

      staff.forEach(member => {
        roleCount[member.role] = (roleCount[member.role] || 0) + 1;
        const dept = member.department || 'Not Assigned';
        deptCount[dept] = (deptCount[dept] || 0) + 1;
        const status = member.status || 'ACTIVE';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });

      title.textContent = 'Staff Report';
      data.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div>
            <h4>By Role</h4>
            <ul>
              ${Object.entries(roleCount).map(([role, count]) => `
                <li>${role}: ${count}</li>
              `).join('')}
            </ul>
          </div>
          <div>
            <h4>By Department</h4>
            <ul>
              ${Object.entries(deptCount).map(([dept, count]) => `
                <li>${dept}: ${count}</li>
              `).join('')}
            </ul>
          </div>
          <div>
            <h4>By Status</h4>
            <ul>
              ${Object.entries(statusCount).map(([status, count]) => `
                <li>${status}: ${count}</li>
              `).join('')}
            </ul>
          </div>
        </div>
      `;
      
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      showNotification(`Error generating report: ${error.message}`, 'error');
    }
  },

  clearReport() {
    document.getElementById('reportContent').style.display = 'none';
  },

  calcAverageAge(patients) {
    if (!patients.length) return 0;
    const now = new Date();
    const totalAge = patients.reduce((sum, p) => {
      if (!p.dateOfBirth) return sum;
      const age = now.getFullYear() - new Date(p.dateOfBirth).getFullYear();
      return sum + age;
    }, 0);
    return totalAge / patients.length;
  },

  getInvoiceStatusStats(invoices) {
    console.log('Processing invoices for stats:', invoices);
    const stats = {};
    invoices.forEach(inv => {
      const status = inv.status || 'DRAFT';
      if (!stats[status]) {
        stats[status] = { status, count: 0, amount: 0 };
      }
      stats[status].count++;
      stats[status].amount += parseFloat(inv.totalAmount) || 0;
    });

    const total = invoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
    console.log('Stats result:', stats, 'Total:', total);
    return Object.values(stats).map(stat => ({
      ...stat,
      percentage: total > 0 ? (stat.amount / total) * 100 : 0
    }));
  }
};