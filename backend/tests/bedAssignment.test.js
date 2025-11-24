// Bed Assignment Tests
const request = require('supertest');
const app = require('../src/index');
const { sequelize } = require('../src/config/database');
const { Ward, Room, Bed } = require('../src/models/Ward');
const Patient = require('../src/models/Patient');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/passwordUtils');

describe('Bed Assignment API', () => {
  let authToken;
  let adminUser;
  let testWard;
  let testRoom;
  let testBed;
  let testPatient;

  beforeAll(async () => {
    // Wait for the app to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create admin user for testing
    const passwordHash = await hashPassword('Admin@123');
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@hospital.com',
      passwordHash,
      role: 'ADMIN',
      department: 'Administration'
    });
    
    // Login as admin to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hospital.com',
        password: 'Admin@123'
      });
    
    authToken = loginRes.body.data.accessToken;
    adminUser = loginRes.body.data.user;
    
    // Create test data
    testWard = await Ward.create({
      wardName: 'Test Ward',
      department: 'Test Department',
      totalBeds: 10
    });
    
    testRoom = await Room.create({
      wardId: testWard.id,
      roomNumber: '101',
      totalBeds: 4,
      roomType: 'GENERAL'
    });
    
    testBed = await Bed.create({
      roomId: testRoom.id,
      bedNumber: 'B101-1',
      status: 'AVAILABLE'
    });
    
    testPatient = await Patient.create({
      name: 'Test Patient',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      contactNumber: '1234567890',
      email: 'test@example.com'
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testBed) await testBed.destroy();
    if (testRoom) await testRoom.destroy();
    if (testWard) await testWard.destroy();
    if (testPatient) await testPatient.destroy();
    // Clean up admin user
    const admin = await User.findOne({ where: { email: 'admin@hospital.com' } });
    if (admin) await admin.destroy();
  });

  describe('POST /api/wards/beds/:id/assign', () => {
    it('should assign a bed to a patient successfully', async () => {
      const res = await request(app)
        .post(`/api/wards/beds/${testBed.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatient.id
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Bed assigned successfully');
      expect(res.body.data.status).toBe('OCCUPIED');
      expect(res.body.data.occupantPatientId).toBe(testPatient.id);
    });

    it('should fail to assign a bed when patient ID is missing', async () => {
      const res = await request(app)
        .post(`/api/wards/beds/${testBed.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Patient ID is required');
    });

    it('should fail to assign a bed when bed is not found', async () => {
      const res = await request(app)
        .post('/api/wards/beds/invalid-bed-id/assign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatient.id
        });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Bed not found');
    });

    it('should fail to assign a bed that is already occupied', async () => {
      // First assign the bed
      await request(app)
        .post(`/api/wards/beds/${testBed.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatient.id
        });
      
      // Try to assign the same bed again
      const res = await request(app)
        .post(`/api/wards/beds/${testBed.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatient.id
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Bed is not available for assignment');
    });

    it('should fail to assign a bed when patient is not found', async () => {
      // Create a new available bed for testing
      const newBed = await Bed.create({
        roomId: testRoom.id,
        bedNumber: 'B101-2',
        status: 'AVAILABLE'
      });
      
      const res = await request(app)
        .post(`/api/wards/beds/${newBed.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: 'invalid-patient-id'
        });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Patient not found');
      
      // Clean up
      await newBed.destroy();
    });
  });

  describe('POST /api/wards/beds/:id/unassign', () => {
    beforeEach(async () => {
      // Ensure bed is assigned before each test
      await testBed.update({
        status: 'OCCUPIED',
        occupantPatientId: testPatient.id,
        occupancyStartDate: new Date()
      });
    });

    it('should unassign a bed successfully', async () => {
      const res = await request(app)
        .post(`/api/wards/beds/${testBed.id}/unassign`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Bed unassigned successfully');
      expect(res.body.data.status).toBe('AVAILABLE');
      expect(res.body.data.occupantPatientId).toBeNull();
    });

    it('should fail to unassign a bed when bed is not found', async () => {
      const res = await request(app)
        .post('/api/wards/beds/invalid-bed-id/unassign')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Bed not found');
    });

    it('should fail to unassign a bed that is not occupied', async () => {
      // First unassign the bed
      await testBed.update({
        status: 'AVAILABLE',
        occupantPatientId: null,
        occupancyStartDate: null
      });
      
      const res = await request(app)
        .post(`/api/wards/beds/${testBed.id}/unassign`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Bed is not currently assigned');
    });
  });

  describe('Ward Occupancy Updates', () => {
    it('should update ward occupiedBeds count when bed is assigned', async () => {
      // Get initial ward data
      const initialWard = await Ward.findByPk(testWard.id);
      const initialOccupiedCount = initialWard.occupiedBeds || 0;
      
      // Create a new available bed for testing
      const newBed = await Bed.create({
        roomId: testRoom.id,
        bedNumber: 'B101-3',
        status: 'AVAILABLE'
      });
      
      // Assign the bed
      await request(app)
        .post(`/api/wards/beds/${newBed.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          patientId: testPatient.id
        });
      
      // Check that ward occupiedBeds count was updated
      const updatedWard = await Ward.findByPk(testWard.id);
      expect(updatedWard.occupiedBeds).toBe(initialOccupiedCount + 1);
      
      // Clean up
      await newBed.destroy();
    });

    it('should update ward occupiedBeds count when bed is unassigned', async () => {
      // Create a new occupied bed for testing
      const newBed = await Bed.create({
        roomId: testRoom.id,
        bedNumber: 'B101-4',
        status: 'OCCUPIED',
        occupantPatientId: testPatient.id,
        occupancyStartDate: new Date()
      });
      
      // Get initial ward data
      const initialWard = await Ward.findByPk(testWard.id);
      const initialOccupiedCount = initialWard.occupiedBeds || 0;
      
      // Unassign the bed
      await request(app)
        .post(`/api/wards/beds/${newBed.id}/unassign`)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Check that ward occupiedBeds count was updated
      const updatedWard = await Ward.findByPk(testWard.id);
      expect(updatedWard.occupiedBeds).toBe(initialOccupiedCount - 1);
      
      // Clean up
      await newBed.destroy();
    });
  });
});