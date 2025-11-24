// Beds Module
const BedsModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    try {
      // Load all beds with their ward and room information
      const response = await api.getBedStatus();
      const beds = response.data.beds || [];
      
      // Group beds by ward
      const wards = {};
      beds.forEach(bed => {
        const wardName = bed.room.ward.wardName;
        if (!wards[wardName]) {
          wards[wardName] = {
            wardId: bed.room.ward.id,
            department: bed.room.ward.department,
            totalBeds: 0,
            availableBeds: 0,
            occupiedBeds: 0
          };
        }
        
        wards[wardName].totalBeds++;
        if (bed.status === 'AVAILABLE') {
          wards[wardName].availableBeds++;
        } else if (bed.status === 'OCCUPIED') {
          wards[wardName].occupiedBeds++;
        }
      });
      
      // Convert to array for easier rendering
      const wardsArray = Object.entries(wards).map(([wardName, wardData]) => ({
        wardName,
        ...wardData
      }));
      
      const bedsHTML = `
        <div class="beds">
          <div class="header">
            <h2>Bed Overview</h2>
            <div>
              <button class="btn btn-primary" onclick="BedsModule.refreshBeds()">Refresh</button>
              <button class="btn btn-secondary" onclick="BedsModule.showAssignBedModal()">Assign Bed</button>
            </div>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Wards</div>
              <div class="stat-value">${wardsArray.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Beds</div>
              <div class="stat-value">${beds.length}</div>
            </div>
            <div class="stat-card green">
              <div class="stat-label">Available Beds</div>
              <div class="stat-value">${beds.filter(bed => bed.status === 'AVAILABLE').length}</div>
            </div>
            <div class="stat-card red">
              <div class="stat-label">Occupied Beds</div>
              <div class="stat-value">${beds.filter(bed => bed.status === 'OCCUPIED').length}</div>
            </div>
          </div>
          
          <h3>Ward Bed Summary</h3>
          <div class="wards-summary">
            ${wardsArray.map(ward => `
              <div class="ward-summary-card">
                <div class="ward-header">
                  <h4>${ward.wardName}</h4>
                  <span class="text-muted">${ward.department}</span>
                </div>
                <div class="ward-stats">
                  <div class="stat-item">
                    <span class="stat-label">Total Beds:</span>
                    <span class="stat-value">${ward.totalBeds}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Available:</span>
                    <span class="stat-value text-success">${ward.availableBeds}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Occupied:</span>
                    <span class="stat-value text-danger">${ward.occupiedBeds}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Occupancy Rate:</span>
                    <span class="stat-value">${ward.totalBeds > 0 ? Math.round((ward.occupiedBeds/ward.totalBeds)*100) : 0}%</span>
                  </div>
                </div>
                <div class="mt-2">
                  <button class="btn btn-sm btn-primary" onclick="BedsModule.viewWardDetails('${ward.wardId}')">View Details</button>
                  <button class="btn btn-sm btn-secondary" onclick="BedsModule.showAssignBedModal('${ward.wardId}')">Assign Bed</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Assign Bed Modal -->
        <div id="assignBedModal" class="modal hidden">
          <div class="modal-content" style="max-width: 600px;">
            <div class="flex-between mb-3">
              <h3>Assign Bed</h3>
              <button class="btn btn-sm btn-secondary" onclick="document.getElementById('assignBedModal').classList.add('hidden')">×</button>
            </div>
            <form id="assignBedForm">
              <input type="hidden" id="assignWardId">
              <div class="form-group">
                <label>Select Patient *</label>
                <select id="assignPatientId" class="form-control" required>
                  <option value="">Loading patients...</option>
                </select>
              </div>
              <div class="form-group">
                <label>Select Ward *</label>
                <select id="assignWardSelect" class="form-control" required>
                  <option value="">Loading wards...</option>
                </select>
              </div>
              <div class="form-group">
                <label>Select Bed *</label>
                <select id="assignBedId" class="form-control" required>
                  <option value="">Select a ward first</option>
                </select>
              </div>
              <div class="form-group mt-4">
                <button type="button" class="btn btn-secondary mr-2" onclick="document.getElementById('assignBedModal').classList.add('hidden')">Cancel</button>
                <button type="submit" class="btn btn-primary">Assign Bed</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      content.innerHTML = bedsHTML;
      
      // Add form submit handler
      const assignBedForm = document.getElementById('assignBedForm');
      if (assignBedForm) {
        assignBedForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.assignBed();
        });
      }
      
      // Add ward selection handler
      const assignWardSelect = document.getElementById('assignWardSelect');
      if (assignWardSelect) {
        assignWardSelect.addEventListener('change', (e) => {
          const wardId = e.target.value;
          if (wardId) {
            document.getElementById('assignWardId').value = wardId;
            this.loadBedsForWard(wardId);
          } else {
            document.getElementById('assignBedId').innerHTML = '<option value="">Select a ward first</option>';
          }
        });
      }
      
      // Load patients and wards for the assign bed form
      this.loadPatientsForAssignment();
      this.loadWardsForAssignment();
    } catch (error) {
      content.innerHTML = `
        <div class="beds">
          <h2>Bed Overview</h2>
          <div class="error-message">
            <p>Error loading bed overview: ${error.message}</p>
            <button class="btn btn-primary" onclick="BedsModule.render()">Retry</button>
          </div>
        </div>
      `;
    }
  },
  
  refreshBeds() {
    this.render();
  },
  
  async loadPatientsForAssignment() {
    try {
      const response = await api.getPatients(1, 1000);
      const patients = response.data || [];
      
      const patientSelect = document.getElementById('assignPatientId');
      if (patientSelect) {
        let options = '<option value="">Select a patient</option>';
        patients.forEach(patient => {
          options += `<option value="${patient.id}">${patient.name}</option>`;
        });
        patientSelect.innerHTML = options;
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  },
  
  async loadWardsForAssignment() {
    try {
      // Fetch all wards from the backend
      const response = await api.getWards(1, 1000);
      const wards = response.data || [];
      
      const wardSelect = document.getElementById('assignWardSelect');
      if (wardSelect) {
        let options = '<option value="">Select a ward</option>';
        wards.forEach(ward => {
          options += `<option value="${ward.id}">${ward.wardName} (${ward.department})</option>`;
        });
        wardSelect.innerHTML = options;
      }
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  },
  
  async loadBedsForWard(wardId) {
    try {
      console.log('Loading beds for ward:', wardId);
      // Fetch beds for the selected ward from the backend
      const response = await api.getBedStatus(wardId);
      console.log('Bed status response:', response);
      const beds = response.data.beds || [];
      console.log('Beds loaded:', beds);
      
      const bedSelect = document.getElementById('assignBedId');
      if (bedSelect) {
        // Filter only available beds
        const availableBeds = beds.filter(bed => bed.status === 'AVAILABLE');
        console.log('Available beds:', availableBeds);
        
        let options = '<option value="">Select a bed</option>';
        
        if (availableBeds.length === 0) {
          if (beds.length === 0) {
            options = '<option value="">No beds available in this ward</option>';
          } else {
            options = '<option value="">All beds occupied</option>';
          }
        } else {
          availableBeds.forEach(bed => {
            options += `<option value="${bed.id}">Room ${bed.room.roomNumber} - Bed ${bed.bedNumber}</option>`;
          });
        }
        bedSelect.innerHTML = options;
      }
    } catch (error) {
      console.error('Error loading beds:', error);
      showNotification(`Error loading beds: ${error.message}`, 'error');
    }
  },
  
  showAssignBedModal(wardId = null) {
    const modal = document.getElementById('assignBedModal');
    const wardIdInput = document.getElementById('assignWardId');
    const wardSelect = document.getElementById('assignWardSelect');
    
    if (wardId) {
      wardIdInput.value = wardId;
      wardSelect.value = wardId;
      this.loadBedsForWard(wardId);
    } else {
      wardIdInput.value = '';
      wardSelect.value = '';
      document.getElementById('assignBedId').innerHTML = '<option value="">Select a ward first</option>';
    }
    
    // Reset form
    document.getElementById('assignPatientId').value = '';
    
    modal.classList.remove('hidden');
    
    // Re-attach event listeners to ensure they work
    this.attachEventListeners();
  },
  
  attachEventListeners() {
    // Add ward selection handler
    const assignWardSelect = document.getElementById('assignWardSelect');
    if (assignWardSelect) {
      // Clear any existing event listeners by cloning the element
      const newWardSelect = assignWardSelect.cloneNode(true);
      assignWardSelect.parentNode.replaceChild(newWardSelect, assignWardSelect);
      
      // Add event listener
      newWardSelect.addEventListener('change', (e) => {
        const wardId = e.target.value;
        if (wardId) {
          document.getElementById('assignWardId').value = wardId;
          this.loadBedsForWard(wardId);
        } else {
          const assignBedId = document.getElementById('assignBedId');
          if (assignBedId) {
            assignBedId.innerHTML = '<option value="">Select a ward first</option>';
          }
        }
      });
    }
    
    // Add form submit handler
    const assignBedForm = document.getElementById('assignBedForm');
    if (assignBedForm) {
      // Clear any existing event listeners by cloning the element
      const newAssignBedForm = assignBedForm.cloneNode(true);
      assignBedForm.parentNode.replaceChild(newAssignBedForm, assignBedForm);
      
      // Add event listener
      newAssignBedForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.assignBed();
      });
    }
  },
  
  async assignBed() {
    try {
      const wardId = document.getElementById('assignWardId').value;
      const patientId = document.getElementById('assignPatientId').value;
      const bedId = document.getElementById('assignBedId').value;
      
      if (!patientId || !bedId) {
        showNotification('Please select both patient and bed', 'error');
        return;
      }
      
      // Call the new assign endpoint
      await api.assignBed(bedId, patientId);
      showNotification('Bed assigned successfully', 'success');
      
      // Close modal
      document.getElementById('assignBedModal').classList.add('hidden');
      
      // Refresh the view
      this.render();
      
      // Refresh reports if they're open
      this.refreshReports();
    } catch (error) {
      showNotification(`Error assigning bed: ${error.message}`, 'error');
    }
  },
  
  async unassignBed(bedId) {
    try {
      if (!confirm('Are you sure you want to unassign this bed?')) return;
      
      // Call the new unassign endpoint
      await api.unassignBed(bedId);
      showNotification('Bed unassigned successfully', 'success');
      
      // Refresh the view
      this.render();
      
      // Refresh reports if they're open
      this.refreshReports();
      
      // If ward detail modal is open, refresh it
      const wardDetailModal = document.getElementById('wardDetailModal');
      if (wardDetailModal) {
        // Find the ward ID from the modal and refresh it
        const wardId = wardDetailModal.querySelector('button[onclick*="showAssignBedModal"]').onclick.toString().match(/'([^']+)'/)[1];
        this.viewWardDetails(wardId);
      }
    } catch (error) {
      showNotification(`Error unassigning bed: ${error.message}`, 'error');
    }
  },
  
  async viewWardDetails(wardId) {
    try {
      const response = await api.getWardById(wardId);
      const ward = response.data;
      
      let bedsHTML = '';
      if (ward.rooms && ward.rooms.length > 0) {
        ward.rooms.forEach(room => {
          if (room.beds && room.beds.length > 0) {
            bedsHTML += `<h4>Room ${room.roomNumber} (${room.roomType})</h4>`;
            bedsHTML += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">';
            room.beds.forEach(bed => {
              let statusClass = 'bg-secondary';
              let statusText = bed.status;
              let patientInfo = '';
              
              if (bed.status === 'OCCUPIED' && bed.occupantPatientId) {
                statusClass = 'bg-danger';
                patientInfo = `<br><small>Patient: ${bed.occupantPatientId || 'Unknown'}</small>`;
              } else if (bed.status === 'AVAILABLE') {
                statusClass = 'bg-success';
              }
              
              bedsHTML += `
                <div class="card p-2">
                  <div class="flex-between">
                    <strong>Bed ${bed.bedNumber}</strong>
                    <span class="badge ${statusClass}">${statusText}</span>
                  </div>
                  ${patientInfo}
                  <div class="mt-2">
                    ${bed.status === 'AVAILABLE' ? 
                      `<button class="btn btn-sm btn-primary" onclick="BedsModule.showAssignBedModal('${ward.id}'); setTimeout(() => { document.getElementById('assignBedId').value = '${bed.id}'; }, 100);">Assign</button>` :
                      `<button class="btn btn-sm btn-warning" onclick="BedsModule.unassignBed('${bed.id}')">Unassign</button>`
                    }
                  </div>
                </div>
              `;
            });
            bedsHTML += '</div>';
          }
        });
      } else {
        bedsHTML = '<p>No beds configured for this ward.</p>';
      }
      
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'wardDetailModal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
          <div class="flex-between mb-3">
            <h3>${ward.wardName} - Bed Details</h3>
            <button class="btn btn-sm btn-secondary" onclick="document.getElementById('wardDetailModal').remove()">×</button>
          </div>
          <div class="mb-3">
            <p><strong>Department:</strong> ${ward.department}</p>
            <p><strong>Total Beds:</strong> ${ward.totalBeds}</p>
            <p><strong>Occupied Beds:</strong> ${ward.occupiedBeds || 0}</p>
            <p><strong>Description:</strong> ${ward.description || '-'}</p>
          </div>
          <div class="mt-3">
            <button class="btn btn-secondary mb-3" onclick="BedsModule.showAssignBedModal('${ward.id}')">Assign Bed in this Ward</button>
            ${bedsHTML}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      modal.classList.remove('hidden');
    } catch (error) {
      showNotification(`Error loading ward details: ${error.message}`, 'error');
    }
  },
  
  refreshReports() {
    // If reports module is active, refresh it
    if (window.location.hash === '#reports' && window.ReportsModule) {
      // Check if a report is currently displayed
      const reportContent = document.getElementById('reportContent');
      if (reportContent && reportContent.style.display !== 'none') {
        // Re-generate the currently displayed report
        const reportTitle = document.getElementById('reportTitle').textContent;
        if (reportTitle.includes('Ward Occupancy')) {
          window.ReportsModule.generateWardReport();
        }
      }
    }
  }
};

// Make BedsModule globally available
window.BedsModule = BedsModule;