// Dashboard Module
const DashboardModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const dashboardHTML = `
      <div class="dashboard">
        <h2>Dashboard</h2>
        
        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-label">Total Patients</div>
            <div class="stat-value" id="totalPatients">0</div>
          </div>
          <div class="stat-card red">
            <div class="stat-label">Today's Appointments</div>
            <div class="stat-value" id="todayAppointments">0</div>
          </div>
          <div class="stat-card green">
            <div class="stat-label">Available Beds</div>
            <div class="stat-value" id="availableBeds">0</div>
          </div>
          <div class="stat-card orange">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value" id="totalRevenue">$0</div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">Daily Admissions Trend</h3>
          <canvas id="admissionsChart"></canvas>
        </div>

        <div class="card">
          <h3 class="card-title">Department-wise Appointments</h3>
          <canvas id="appointmentsChart"></canvas>
        </div>

        <div class="card">
          <h3 class="card-title">Bed Occupancy Status</h3>
          <canvas id="occupancyChart"></canvas>
        </div>
      </div>
    `;

    content.innerHTML = dashboardHTML;
    
    try {
      // Load dashboard data
      const [patients, appointments, wards, invoices] = await Promise.all([
        api.getPatients(1, 1000), // Get all patients for better stats
        api.getAppointments(1, 1000), // Get all appointments
        api.getWards(1, 1000), // Get all wards
        api.getInvoices(1, 1000) // Fetch all invoices to calculate total revenue
      ]);

      console.log('Dashboard data loaded:', { patients, appointments, wards, invoices });

      // Update stat cards
      document.getElementById('totalPatients').textContent = patients.pagination?.total || 0;
      document.getElementById('todayAppointments').textContent = appointments.data?.length || 0;
      
      // Calculate available beds
      let totalBeds = 0, occupiedBeds = 0;
      wards.data?.forEach(ward => {
        totalBeds += ward.totalBeds || 0;
        occupiedBeds += ward.occupiedBeds || 0;
      });
      document.getElementById('availableBeds').textContent = totalBeds - occupiedBeds;
      
      // Calculate total revenue from all paid invoices
      let totalRevenue = 0;
      
      if (invoices.data) {
        console.log('Processing invoices for revenue calculation...');
        invoices.data.forEach(invoice => {
          console.log('Invoice:', invoice.invoiceNumber, 'Status:', invoice.status, 'Total Amount:', invoice.totalAmount);
          
          // Check if invoice is paid
          if (invoice.status === 'PAID') {
            const amount = parseFloat(invoice.totalAmount) || 0;
            console.log('Adding to revenue:', amount);
            totalRevenue += amount;
          }
        });
      }
      
      console.log('Total revenue:', totalRevenue);
      document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);

      // Initialize charts with real data
      this.initializeCharts(patients, appointments, wards, invoices);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showNotification(`Error loading dashboard: ${error.message}`, 'error');
    }
  },

  initializeCharts(patients, appointments, wards, invoices) {
    // Daily Admissions Trend - using appointment data grouped by date
    const admissionsCtx = document.getElementById('admissionsChart')?.getContext('2d');
    if (admissionsCtx) {
      // Group appointments by date
      const admissionData = {};
      
      appointments.data?.forEach(appointment => {
        if (appointment.slotStart) {
          const date = new Date(appointment.slotStart);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          admissionData[dateStr] = (admissionData[dateStr] || 0) + 1;
        }
      });
      
      // Sort dates and get last 7 days
      const dates = Object.keys(admissionData).sort();
      const last7Days = dates.slice(-7);
      const admissionCounts = last7Days.map(date => admissionData[date]);
      
      // Format dates for display
      const formattedDates = last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      
      new Chart(admissionsCtx, {
        type: 'line',
        data: {
          labels: formattedDates,
          datasets: [{
            label: 'Admissions',
            data: admissionCounts,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4,
            fill: true
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Number of Admissions' } },
            x: { title: { display: true, text: 'Date' } }
          },
        },
      });
    }

    // Department-wise Appointments
    const appointmentsCtx = document.getElementById('appointmentsChart')?.getContext('2d');
    if (appointmentsCtx) {
      // Count appointments by department
      const departmentCounts = {};
      
      appointments.data?.forEach(appointment => {
        // Get the doctor's department if available
        const department = appointment.doctor?.department || 'Unknown';
        departmentCounts[department] = (departmentCounts[department] || 0) + 1;
      });
      
      const departments = Object.keys(departmentCounts);
      const counts = departments.map(dept => departmentCounts[dept]);
      
      new Chart(appointmentsCtx, {
        type: 'bar',
        data: {
          labels: departments,
          datasets: [{
            label: 'Appointments',
            data: counts,
            backgroundColor: '#3498db',
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Number of Appointments' } },
            x: { title: { display: true, text: 'Department' } }
          },
        },
      });
    }

    // Bed Occupancy Status
    const occupancyCtx = document.getElementById('occupancyChart')?.getContext('2d');
    if (occupancyCtx && wards.data) {
      let totalBeds = 0;
      let occupiedBeds = 0;
      
      wards.data.forEach(ward => {
        totalBeds += ward.totalBeds || 0;
        occupiedBeds += ward.occupiedBeds || 0;
      });
      
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);
      
      new Chart(occupancyCtx, {
        type: 'doughnut',
        data: {
          labels: ['Occupied', 'Available'],
          datasets: [{
            data: [occupiedBeds, availableBeds],
            backgroundColor: ['#e74c3c', '#27ae60'],
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        },
      });
    }
  },
};
