const WardsModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    try {
      // Load wards data
      const response = await api.getWards(1, 100);
      const wards = response.data || [];
      
      let wardsHTML = `
        <div class="wards">
          <div class="flex-between mb-3">
            <h2>Wards Management</h2>
            <button class="btn btn-primary" onclick="WardsModule.openWardForm()">Add Ward</button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      `;
      
      wards.forEach(ward => {
        // Calculate bed statistics
        const totalBeds = ward.totalBeds || 0;
        const occupiedBeds = ward.occupiedBeds || 0;
        const availableBeds = totalBeds - occupiedBeds;
        
        wardsHTML += `
          <div class="card">
            <div class="flex-between">
              <h3>${ward.wardName}</h3>
              <button class="btn btn-sm btn-secondary" onclick="WardsModule.viewWard('${ward.id}')">View</button>
            </div>
            <p class="text-muted">${ward.department}</p>
            <div class="mt-3">
              <div class="flex-between text-sm">
                <span>Total Beds:</span>
                <span>${totalBeds}</span>
              </div>
              <div class="flex-between text-sm">
                <span>Occupied:</span>
                <span class="text-danger">${occupiedBeds}</span>
              </div>
              <div class="flex-between text-sm">
                <span>Available:</span>
                <span class="text-success">${availableBeds}</span>
              </div>
            </div>
            <div class="mt-2">
              <div class="progress-bar">
                <div class="progress" style="width: ${(occupiedBeds/totalBeds)*100 || 0}%;"></div>
              </div>
              <div class="text-right text-sm mt-1">
                ${totalBeds > 0 ? Math.round((occupiedBeds/totalBeds)*100) : 0}% Occupied
              </div>
            </div>
            <div class="mt-3 flex-between">
              <button class="btn btn-sm btn-outline" onclick="WardsModule.editWard('${ward.id}')">Edit</button>
              <button class="btn btn-sm btn-outline" onclick="WardsModule.manageRooms('${ward.id}')">Manage Rooms</button>
            </div>
          </div>
        `;
      });
      
      wardsHTML += `
          </div>
        </div>
        
        <!-- Ward Form Modal -->
        <div id="wardModal" class="modal hidden">
          <div class="modal-content" style="max-width: 500px;">
            <div class="flex-between mb-3">
              <h3 id="modalTitle">Add Ward</h3>
              <button class="btn btn-sm btn-secondary" onclick="WardsModule.closeModal()">×</button>
            </div>
            <form id="wardForm">
              <input type="hidden" id="wardId">
              <div class="form-group">
                <label>Ward Name *</label>
                <input type="text" id="wardName" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Department *</label>
                <input type="text" id="department" class="form-control" required>
              </div>
              <div class="form-group">
                <label>Total Beds *</label>
                <input type="number" id="totalBeds" class="form-control" min="1" required>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="description" class="form-control" rows="3"></textarea>
              </div>
              <div class="form-group mt-4">
                <button type="button" class="btn btn-secondary mr-2" onclick="WardsModule.closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Ward</button>
              </div>
            </form>
          </div>
        </div>
      `;
      
      content.innerHTML = wardsHTML;
      
      // Add form submit handler
      document.getElementById('wardForm').addEventListener('submit', (e) => {
        e.preventDefault();
        WardsModule.saveWard();
      });
    } catch (error) {
      showNotification(`Error loading wards: ${error.message}`, 'error');
    }
  },
  
  openWardForm(wardId = null) {
    const modal = document.getElementById('wardModal');
    const form = document.getElementById('wardForm');
    const title = document.getElementById('modalTitle');
    
    // Reset form
    form.reset();
    document.getElementById('wardId').value = '';
    
    if (wardId) {
      // Edit existing ward
      title.textContent = 'Edit Ward';
      this.loadWardData(wardId);
    } else {
      // Add new ward
      title.textContent = 'Add Ward';
    }
    
    modal.classList.remove('hidden');
  },
  
  async loadWardData(wardId) {
    try {
      const response = await api.getWardById(wardId);
      const ward = response.data;
      
      document.getElementById('wardId').value = ward.id;
      document.getElementById('wardName').value = ward.wardName;
      document.getElementById('department').value = ward.department;
      document.getElementById('totalBeds').value = ward.totalBeds;
      document.getElementById('description').value = ward.description || '';
    } catch (error) {
      showNotification(`Error loading ward: ${error.message}`, 'error');
    }
  },
  
  async saveWard() {
    try {
      const wardId = document.getElementById('wardId').value;
      const wardData = {
        wardName: document.getElementById('wardName').value,
        department: document.getElementById('department').value,
        totalBeds: parseInt(document.getElementById('totalBeds').value),
        description: document.getElementById('description').value
      };
      
      if (wardId) {
        // Update existing ward
        await api.updateWard(wardId, wardData);
        showNotification('Ward updated successfully', 'success');
      } else {
        // Create new ward
        await api.createWard(wardData);
        showNotification('Ward created successfully', 'success');
      }
      
      this.closeModal();
      this.render(); // Refresh the view
    } catch (error) {
      showNotification(`Error saving ward: ${error.message}`, 'error');
    }
  },
  
  closeModal() {
    document.getElementById('wardModal').classList.add('hidden');
  },
  
  async viewWard(wardId) {
    try {
      const response = await api.getWardById(wardId);
      const ward = response.data;
      
      // Get all patients for assignment dropdown
      const patientsResponse = await api.getPatients(1, 1000);
      const patients = patientsResponse.data || [];
      
      let roomsHTML = '';
      if (ward.rooms && ward.rooms.length > 0) {
        ward.rooms.forEach(room => {
          let bedsHTML = '';
          if (room.beds && room.beds.length > 0) {
            bedsHTML += '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">';
            room.beds.forEach(bed => {
              let statusClass = 'bg-secondary';
              let statusText = bed.status;
              let patientInfo = '';
              
              if (bed.status === 'OCCUPIED' && bed.occupantPatientId) {
                statusClass = 'bg-danger';
                // Try to find patient name
                const patient = patients.find(p => p.id === bed.occupantPatientId);
                patientInfo = `<br><small>Patient: ${patient ? patient.name : 'Unknown'}</small>`;
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
                      `<button class="btn btn-sm btn-primary" onclick="WardsModule.showAssignBedModal('${bed.id}', '${ward.id}')">Assign</button>` :
                      `<button class="btn btn-sm btn-warning" onclick="WardsModule.unassignBed('${bed.id}', '${ward.id}')">Unassign</button>`
                    }
                  </div>
                </div>
              `;
            });
            bedsHTML += '</div>';
          } else {
            bedsHTML = '<p class="text-muted">No beds in this room.</p>';
          }
          
          roomsHTML += `
            <div class="card p-3 mb-3">
              <div class="flex-between">
                <h4>Room ${room.roomNumber}</h4>
                <span class="badge bg-info">${room.roomType}</span>
              </div>
              <div class="mt-2">
                <p><strong>Total Beds:</strong> ${room.totalBeds}</p>
                <p><strong>Status:</strong> ${room.status}</p>
              </div>
              <h5 class="mt-3">Beds</h5>
              ${bedsHTML}
            </div>
          `;
        });
      } else {
        roomsHTML = '<p>No rooms configured for this ward.</p>';
      }
      
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'wardDetailModal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
          <div class="flex-between mb-3">
            <h3>${ward.wardName} Details</h3>
            <button class="btn btn-sm btn-secondary" onclick="document.getElementById('wardDetailModal').remove()">×</button>
          </div>
          <div class="mb-4">
            <p><strong>Department:</strong> ${ward.department}</p>
            <p><strong>Total Beds:</strong> ${ward.totalBeds}</p>
            <p><strong>Occupied Beds:</strong> ${ward.occupiedBeds || 0}</p>
            <p><strong>Description:</strong> ${ward.description || '-'}</p>
          </div>
          <div class="mt-3">
            <button class="btn btn-primary mb-3" onclick="WardsModule.showAssignBedModal('', '${ward.id}')">Assign Bed in this Ward</button>
            <h4>Rooms & Beds</h4>
            ${roomsHTML}
          </div>
          <div class="mt-3">
            <button class="btn btn-primary" onclick="WardsModule.manageRooms('${ward.id}')">Manage Rooms</button>
            <button class="btn btn-secondary" onclick="window.location.hash='#beds'">View All Beds</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      modal.classList.remove('hidden');
    } catch (error) {
      showNotification(`Error loading ward details: ${error.message}`, 'error');
    }
  },
  
  showAssignBedModal(bedId, wardId) {
    // Use the existing assign bed modal from BedsModule
    if (window.BedsModule) {
      BedsModule.showAssignBedModal(wardId);
      // If a specific bed is selected, set it in the form
      if (bedId) {
        setTimeout(() => {
          document.getElementById('assignBedId').value = bedId;
        }, 100);
      }
    } else {
      showNotification('Beds module not available', 'error');
    }
  },
  
  async unassignBed(bedId, wardId) {
    try {
      if (!confirm('Are you sure you want to unassign this bed?')) return;
      
      // Use the API client to unassign the bed
      await api.unassignBed(bedId);
      showNotification('Bed unassigned successfully', 'success');
      
      // Refresh the ward view
      this.viewWard(wardId);
      
      // Refresh reports if they're open
      if (window.BedsModule && typeof window.BedsModule.refreshReports === 'function') {
        window.BedsModule.refreshReports();
      }
    } catch (error) {
      showNotification(`Error unassigning bed: ${error.message}`, 'error');
    }
  },
  
  editWard(wardId) {
    this.openWardForm(wardId);
  },
  
  async manageRooms(wardId) {
    // For now, just view the ward which shows room management
    this.viewWard(wardId);
  },
  
  viewRoomBeds(roomId) {
    // Navigate to the beds section and filter by room
    window.location.hash = '#beds';
    // We would implement filtering in the beds module in a real implementation
    showNotification('Navigate to Beds section to view room beds', 'info');
  }
};

// Make WardsModule globally available
window.WardsModule = WardsModule;