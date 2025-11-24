// Patients Module
const PatientsModule = {
  async render() {
    const content = document.getElementById('pageContent');
    
    const patientsHTML = `
      <div class="patients">
        <div class="header">
          <h2>Patients</h2>
          <button class="btn btn-primary" onclick="PatientsModule.openForm()">Add New Patient</button>
        </div>
        
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Search patients..." onkeyup="PatientsModule.searchPatients()">
        </div>
        
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Blood Group</th>
                <th>Insurance</th>
                <th>Bed Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="patientsList">
              <tr><td colspan="7" class="text-center">Loading...</td></tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination" id="patientsPagination"></div>
      </div>
      
      <div id="modal" class="modal hidden">
        <div class="modal-content">
          <span class="close" onclick="document.getElementById('modal').classList.add('hidden')">&times;</span>
          <div class="modal-body"></div>
        </div>
      </div>
    `;
    
    content.innerHTML = patientsHTML;
    
    try {
      await this.loadPatients(1);
    } catch (error) {
      showNotification(`Error loading patients: ${error.message}`, 'error');
    }
  },

  async loadPatients(page = 1, search = '') {
    try {
      const response = await api.getPatients(page, 10, search);
      this.renderPatientsList(response.data);
      this.renderPagination(response.pagination);
    } catch (error) {
      showNotification(`Error loading patients: ${error.message}`, 'error');
    }
  },

  renderPatientsList(patients) {
    const tbody = document.getElementById('patientsList');
    if (patients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No patients found</td></tr>';
      return;
    }

    tbody.innerHTML = patients.map(patient => `
      <tr>
        <td>${patient.name}</td>
        <td>${patient.email || '-'}</td>
        <td>${patient.contactNumber || '-'}</td>
        <td>${patient.bloodGroup || '-'}</td>
        <td>${patient.insuranceProvider || '-'}</td>
        <td id="bed-status-${patient.id}"><span class="badge bg-secondary">Loading...</span></td>
        <td>
          <button class="btn btn-primary" onclick="PatientsModule.viewPatient('${patient.id}')">View</button>
          <button class="btn btn-secondary" onclick="PatientsModule.editPatient('${patient.id}')">Edit</button>
          <button class="btn btn-danger" onclick="PatientsModule.deletePatient('${patient.id}')">Delete</button>
        </td>
      </tr>
    `).join('');

    // Fetch bed status for each patient
    patients.forEach(patient => {
      this.updatePatientBedStatus(patient.id);
    });
  },

  async updatePatientBedStatus(patientId) {
    try {
      const bedResponse = await api.getPatientBedStatus(patientId);
      const occupiedBeds = bedResponse.data.beds.filter(bed => bed.status === 'OCCUPIED');
      
      const bedStatusCell = document.getElementById(`bed-status-${patientId}`);
      if (bedStatusCell) {
        if (occupiedBeds.length > 0) {
          bedStatusCell.innerHTML = '<span class="badge bg-danger">OCCUPIED</span>';
        } else {
          bedStatusCell.innerHTML = '<span class="badge bg-success">FREE</span>';
        }
      }
    } catch (error) {
      const bedStatusCell = document.getElementById(`bed-status-${patientId}`);
      if (bedStatusCell) {
        bedStatusCell.innerHTML = '<span class="badge bg-secondary">Unknown</span>';
      }
    }
  },

  renderPagination(pagination) {
    const container = document.getElementById('patientsPagination');
    const buttons = [];
    
    for (let i = 1; i <= pagination.pages; i++) {
      buttons.push(`
        <button ${i === pagination.page ? 'class="btn active"' : 'class="btn"'} 
                onclick="PatientsModule.loadPatients(${i})">
          ${i}
        </button>
      `);
    }
    
    container.innerHTML = buttons.join('');
  },

  searchPatients() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value;
    this.loadPatients(1, searchTerm);
  },

  openForm(patientId = null) {
    const modal = document.getElementById('modal');
    const modalBody = document.querySelector('.modal-body');

    const form = `
      <h3>${patientId ? 'Edit Patient' : 'Add New Patient'}</h3>
      <form id="patientForm">
        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" name="name" required>
          </div>
          <div class="form-group">
            <label>Date of Birth *</label>
            <input type="date" name="dateOfBirth" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Gender *</label>
            <select name="gender" required>
              <option value="">Select Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Blood Group</label>
            <select name="bloodGroup">
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email">
          </div>
          <div class="form-group">
            <label>Contact Number</label>
            <input type="tel" name="contactNumber">
          </div>
        </div>
        
        <div class="form-group">
          <label>Address</label>
          <textarea name="address" rows="2"></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Emergency Contact Name</label>
            <input type="text" name="emergencyContactName">
          </div>
          <div class="form-group">
            <label>Emergency Contact Number</label>
            <input type="tel" name="emergencyContactNumber">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Insurance Provider</label>
            <input type="text" name="insuranceProvider">
          </div>
          <div class="form-group">
            <label>Insurance Policy Number</label>
            <input type="text" name="insurancePolicyNumber">
          </div>
        </div>
        
        <div class="form-group">
          <label>Allergies</label>
          <textarea name="allergies" rows="2"></textarea>
        </div>
        
        <div class="form-group">
          <label>Chronic Conditions</label>
          <textarea name="chronicConditions" rows="2"></textarea>
        </div>
        
        <div class="form-group">
          <label>Current Medications</label>
          <textarea name="currentMedications" rows="2"></textarea>
        </div>
        
        <div class="form-group">
          <label>Notes</label>
          <textarea name="notes" rows="2"></textarea>
        </div>
        
        <button type="submit" class="btn btn-success">Save Patient</button>
      </form>
    `;

    modalBody.innerHTML = form;
    modal.classList.remove('hidden');

    const form_element = document.getElementById('patientForm');
    form_element.addEventListener('submit', (e) => this.handleSubmit(e, patientId));
  },

  async handleSubmit(e, patientId) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Convert date format if needed
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth).toISOString();
    }

    // Map frontend field names to backend field names
    const patientData = {
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      email: data.email,
      contactNumber: data.contactNumber,
      address: data.address,
      emergencyContactName: data.emergencyContactName,
      emergencyContactNumber: data.emergencyContactNumber,
      insuranceProvider: data.insuranceProvider,
      insurancePolicyNumber: data.insurancePolicyNumber,
      bloodGroup: data.bloodGroup,
      allergies: data.allergies,
      chronicConditions: data.chronicConditions,
      currentMedications: data.currentMedications,
      notes: data.notes
    };

    // Remove undefined fields
    Object.keys(patientData).forEach(key => {
      if (patientData[key] === undefined || patientData[key] === '') {
        delete patientData[key];
      }
    });

    try {
      if (patientId) {
        await api.updatePatient(patientId, patientData);
        showNotification('Patient updated successfully', 'success');
      } else {
        await api.createPatient(patientData);
        showNotification('Patient created successfully', 'success');
      }
      
      document.getElementById('modal').classList.add('hidden');
      this.loadPatients(1);
    } catch (error) {
      showNotification(`Error saving patient: ${error.message}`, 'error');
    }
  },

  async viewPatient(id) {
    try {
      const response = await api.getPatientById(id);
      const patient = response.data;
      
      // Get bed occupancy information for this patient
      let bedInfo = '';
      try {
        const bedResponse = await api.getPatientBedStatus(id);
        const occupiedBeds = bedResponse.data.beds.filter(bed => bed.status === 'OCCUPIED');
        
        if (occupiedBeds.length > 0) {
          const bed = occupiedBeds[0]; // Assuming one bed per patient
          bedInfo = `
            <div class="card mt-3">
              <h4>Bed Assignment</h4>
              <p><strong>Ward:</strong> ${bed.room.ward.wardName}</p>
              <p><strong>Room:</strong> ${bed.room.roomNumber}</p>
              <p><strong>Bed ID:</strong> ${bed.id}</p>
              <p><strong>Bed Number:</strong> ${bed.bedNumber}</p>
              <p><strong>Status:</strong> <span class="badge bg-danger">OCCUPIED</span></p>
              <p><strong>Occupancy Start:</strong> ${bed.occupancyStartDate ? new Date(bed.occupancyStartDate).toLocaleDateString() : 'N/A'}</p>
              <button class="btn btn-warning" onclick="PatientsModule.unassignBed('${bed.id}', '${patient.id}')">Unassign Bed</button>
            </div>
          `;
        } else {
          // Get available beds for assignment
          let bedSelection = '';
          try {
            const allBedsResponse = await api.getBedStatus();
            const availableBeds = allBedsResponse.data.beds.filter(bed => bed.status === 'AVAILABLE');
            
            if (availableBeds.length > 0) {
              // Group beds by ward
              const wards = {};
              availableBeds.forEach(bed => {
                const wardName = bed.room.ward.wardName;
                if (!wards[wardName]) {
                  wards[wardName] = [];
                }
                wards[wardName].push(bed);
              });
              
              let bedOptions = '<option value="">Select a bed</option>';
              for (const [wardName, wardBeds] of Object.entries(wards)) {
                bedOptions += `<optgroup label="${wardName}">`;
                wardBeds.forEach(bed => {
                  bedOptions += `<option value="${bed.id}">Room ${bed.room.roomNumber} - Bed ${bed.bedNumber}</option>`;
                });
                bedOptions += `</optgroup>`;
              }
              
              bedSelection = `
                <div class="form-group mt-3">
                  <label>Select Bed:</label>
                  <select id="bedSelection" class="form-control">
                    ${bedOptions}
                  </select>
                  <button class="btn btn-primary mt-2" onclick="PatientsModule.assignBedDirectly('${patient.id}')">Assign Selected Bed</button>
                </div>
              `;
            } else {
              bedSelection = '<p class="text-muted">No available beds</p>';
            }
          } catch (bedError) {
            bedSelection = '<p class="text-danger">Error loading available beds</p>';
          }
          
          bedInfo = `
            <div class="card mt-3">
              <h4>Bed Assignment</h4>
              <p><strong>Status:</strong> <span class="badge bg-success">NOT OCCUPYING BED</span></p>
              ${bedSelection}
            </div>
          `;
        }
      } catch (bedError) {
        console.error('Error fetching bed status:', bedError);
        bedInfo = `
          <div class="card mt-3">
            <h4>Bed Assignment</h4>
            <p>Unable to fetch bed status information</p>
          </div>
        `;
      }
      
      const modal = document.getElementById('modal');
      const modalBody = document.querySelector('.modal-body');
      
      const patientHTML = `
        <h3>Patient Details</h3>
        <div class="patient-details">
          <div class="detail-row">
            <strong>Name:</strong> ${patient.name}
          </div>
          <div class="detail-row">
            <strong>Date of Birth:</strong> ${patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}
          </div>
          <div class="detail-row">
            <strong>Gender:</strong> ${patient.gender || '-'}
          </div>
          <div class="detail-row">
            <strong>Blood Group:</strong> ${patient.bloodGroup || '-'}
          </div>
          <div class="detail-row">
            <strong>Email:</strong> ${patient.email || '-'}
          </div>
          <div class="detail-row">
            <strong>Contact:</strong> ${patient.contactNumber || '-'}
          </div>
          <div class="detail-row">
            <strong>Address:</strong> ${patient.address || '-'}
          </div>
          <div class="detail-row">
            <strong>Emergency Contact:</strong> ${patient.emergencyContactName || '-'} (${patient.emergencyContactNumber || '-'})
          </div>
          <div class="detail-row">
            <strong>Insurance Provider:</strong> ${patient.insuranceProvider || '-'}
          </div>
          <div class="detail-row">
            <strong>Insurance Policy:</strong> ${patient.insurancePolicyNumber || '-'}
          </div>
        </div>
        
        <div class="mt-4">
          <button class="btn btn-secondary" onclick="PatientsModule.editPatient('${patient.id}')">Edit Patient</button>
          <button class="btn btn-danger" onclick="PatientsModule.deletePatient('${patient.id}')">Delete Patient</button>
          <button class="btn btn-primary" onclick="document.getElementById('modal').classList.add('hidden')">Close</button>
        </div>
      `;
      
      modalBody.innerHTML = patientHTML;
      modal.classList.remove('hidden');
    } catch (error) {
      showNotification(`Error loading patient: ${error.message}`, 'error');
    }
  },

  async assignBed(patientId) {
    try {
      // Redirect to the beds section for bed assignment
      // Close the current modal first
      document.getElementById('modal').classList.add('hidden');
      
      // Navigate to the beds section
      window.location.hash = '#beds';
      
      // Store the patient ID in localStorage for use in the beds module
      localStorage.setItem('assignBedPatientId', patientId);
      
      // Show a notification to guide the user
      setTimeout(() => {
        showNotification('Please select an available bed in the Beds section to assign to this patient', 'info');
      }, 1000);
    } catch (error) {
      showNotification(`Error redirecting to bed assignment: ${error.message}`, 'error');
    }
  },

  async assignBedDirectly(patientId) {
    try {
      const bedId = document.getElementById('bedSelection').value;
      
      if (!bedId) {
        showNotification('Please select a bed', 'error');
        return;
      }
      
      await api.updateBedStatus(bedId, 'OCCUPIED', patientId);
      showNotification('Bed assigned successfully', 'success');
      this.viewPatient(patientId); // Refresh the patient view
    } catch (error) {
      showNotification(`Error assigning bed: ${error.message}`, 'error');
    }
  },

  async unassignBed(bedId, patientId = null) {
    try {
      await api.updateBedStatus(bedId, 'AVAILABLE');
      showNotification('Bed unassigned successfully', 'success');
      
      if (patientId) {
        this.viewPatient(patientId); // Refresh the patient view
      } else {
        this.showBedAssignment(); // Refresh the assignment view
      }
    } catch (error) {
      showNotification(`Error unassigning bed: ${error.message}`, 'error');
    }
  },

  viewInWardSection(wardId) {
    // Close the current modal
    document.getElementById('modal').classList.add('hidden');
    
    // Navigate to the wards section
    window.location.hash = '#wards';
    
    // Show a notification to guide the user
    setTimeout(() => {
      showNotification('Navigating to ward section...', 'info');
    }, 500);
  },

  async editPatient(id) {
    try {
      const response = await api.getPatientById(id);
      this.openForm(id);
      
      // Populate form with data
      const form = document.getElementById('patientForm');
      const patient = response.data;
      
      Object.keys(patient).forEach(key => {
        const field = form.elements[key];
        if (field) {
          if (key === 'dateOfBirth' && patient[key]) {
            // Convert date format for input
            field.value = patient[key].split('T')[0];
          } else {
            field.value = patient[key] || '';
          }
        }
      });
    } catch (error) {
      showNotification(`Error loading patient: ${error.message}`, 'error');
    }
  },

  async deletePatient(id) {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    try {
      await api.deletePatient(id);
      showNotification('Patient deleted successfully', 'success');
      this.loadPatients(1);
    } catch (error) {
      showNotification(`Error deleting patient: ${error.message}`, 'error');
    }
  }
};

// Make PatientsModule globally available
window.PatientsModule = PatientsModule;
