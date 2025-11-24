const sequelize = require('../config/database');
const models = require('../models');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Seed users
    const users = await models.User.bulkCreate([
      {
        name: 'Admin User',
        email: 'admin@hospital.com',
        passwordHash: await require('../utils/passwordUtils').hashPassword('Admin@123'),
        role: 'ADMIN',
        department: 'Administration',
        status: 'ACTIVE',
      },
      {
        name: 'Dr. John Smith',
        email: 'doctor1@hospital.com',
        passwordHash: await require('../utils/passwordUtils').hashPassword('Doctor@123'),
        role: 'DOCTOR',
        department: 'Cardiology',
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'doctor2@hospital.com',
        passwordHash: await require('../utils/passwordUtils').hashPassword('Doctor@123'),
        role: 'DOCTOR',
        department: 'Neurology',
        status: 'ACTIVE',
      },
      {
        name: 'Nurse Emily',
        email: 'nurse1@hospital.com',
        passwordHash: await require('../utils/passwordUtils').hashPassword('Nurse@123'),
        role: 'NURSE',
        department: 'General Ward',
        status: 'ACTIVE',
      },
      {
        name: 'Receptionist Bob',
        email: 'receptionist@hospital.com',
        passwordHash: await require('../utils/passwordUtils').hashPassword('Receptionist@123'),
        role: 'RECEPTIONIST',
        department: 'Front Desk',
        status: 'ACTIVE',
      },
      {
        name: 'Accountant Alice',
        email: 'accountant@hospital.com',
        passwordHash: await require('../utils/passwordUtils').hashPassword('Accountant@123'),
        role: 'ACCOUNTANT',
        department: 'Finance',
        status: 'ACTIVE',
      },
    ]);
    console.log('Users seeded:', users.length);

    // Seed patients
    const patients = await models.Patient.bulkCreate([
      ...Array.from({ length: 20 }, (_, i) => ({
        name: `Patient ${i + 1}`,
        dateOfBirth: new Date(1990 - Math.random() * 30, Math.random() * 12, Math.random() * 28),
        gender: Math.random() > 0.5 ? 'MALE' : 'FEMALE',
        contactNumber: `555-${String(i + 1).padStart(4, '0')}`,
        email: `patient${i + 1}@example.com`,
        bloodGroup: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'][Math.floor(Math.random() * 8)],
        insuranceProvider: Math.random() > 0.5 ? 'Blue Cross' : 'Aetna',
      })),
    ]);
    console.log('Patients seeded:', patients.length);

    // Seed appointments
    const appointments = [];
    for (let i = 0; i < 20; i++) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
      startDate.setHours(Math.floor(Math.random() * 17) + 8);
      
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);

      appointments.push({
        patientId: patients[i % patients.length].id,
        doctorId: users.find(u => u.role === 'DOCTOR').id,
        slotStart: startDate,
        slotEnd: endDate,
        appointmentType: ['CONSULTATION', 'FOLLOW_UP'][Math.floor(Math.random() * 2)],
        reason: 'Regular checkup',
        status: 'SCHEDULED',
      });
    }
    await models.Appointment.bulkCreate(appointments);
    console.log('Appointments seeded:', appointments.length);

    // Seed wards
    const wards = await models.Ward.bulkCreate([
      { wardName: 'General Ward A', department: 'General', totalBeds: 20 },
      { wardName: 'Cardiology Ward', department: 'Cardiology', totalBeds: 15 },
      { wardName: 'ICU', department: 'Critical Care', totalBeds: 10 },
      { wardName: 'Pediatrics', department: 'Pediatrics', totalBeds: 12 },
    ]);
    console.log('Wards seeded:', wards.length);

    // Create rooms and beds for each ward
    for (const ward of wards) {
      // Create rooms - for simplicity, we'll create rooms with 4 beds each
      const totalBeds = ward.totalBeds;
      const roomsNeeded = Math.ceil(totalBeds / 4);
      const bedsPerRoom = Math.floor(totalBeds / roomsNeeded);
      const extraBeds = totalBeds % roomsNeeded;
      
      for (let i = 0; i < roomsNeeded; i++) {
        // Create room
        const room = await models.Room.create({
          wardId: ward.id,
          roomNumber: `${i + 1}`,
          totalBeds: bedsPerRoom + (i < extraBeds ? 1 : 0),
          roomType: 'GENERAL',
          status: 'AVAILABLE',
        });
        
        // Create beds for this room
        const bedsInThisRoom = bedsPerRoom + (i < extraBeds ? 1 : 0);
        for (let j = 0; j < bedsInThisRoom; j++) {
          await models.Bed.create({
            roomId: room.id,
            bedNumber: `${j + 1}`,
            status: 'AVAILABLE',
          });
        }
      }
    }
    console.log('Rooms and beds created for all wards');

    // Seed inventory
    const inventoryItems = await models.InventoryItem.bulkCreate([
      { name: 'Paracetamol', itemType: 'MEDICINE', quantity: 500, reorderLevel: 100, unit: 'tablets', location: 'Store A' },
      { name: 'Bandages', itemType: 'SUPPLY', quantity: 1000, reorderLevel: 200, unit: 'box', location: 'Store B' },
      { name: 'Oxygen', itemType: 'SUPPLY', quantity: 100, reorderLevel: 50, unit: 'cylinders', location: 'Storage' },
      { name: 'Gloves', itemType: 'SUPPLY', quantity: 5000, reorderLevel: 1000, unit: 'pairs', location: 'Store A' },
      { name: 'Syringes', itemType: 'SUPPLY', quantity: 2000, reorderLevel: 500, unit: 'pieces', location: 'Store B' },
    ]);
    console.log('Inventory items seeded:', inventoryItems.length);

    // Seed invoices
    const invoices = [];
    for (let i = 0; i < 15; i++) {
      const patient = patients[i % patients.length];
      const totalAmount = 100 + Math.random() * 900; // Random amount between 100-1000
      const statuses = ['DRAFT', 'PENDING', 'PAID', 'OVERDUE'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // For PAID invoices, set a paidDate
      let paidDate = null;
      if (status === 'PAID') {
        // Set some invoices to have today's date as paid date
        if (Math.random() > 0.5) {
          // Today's date
          paidDate = new Date();
          paidDate.setHours(0, 0, 0, 0);
        } else {
          // A few days ago
          const daysAgo = Math.floor(Math.random() * 3) + 1; // 1-3 days ago
          paidDate = new Date();
          paidDate.setDate(paidDate.getDate() - daysAgo);
          paidDate.setHours(0, 0, 0, 0);
        }
      }
      
      invoices.push({
        patientId: patient.id,
        invoiceNumber: `INV-${String(1000 + i).padStart(4, '0')}`,
        subtotal: totalAmount,
        taxAmount: totalAmount * 0.1, // 10% tax
        discountAmount: Math.random() > 0.7 ? totalAmount * 0.1 : 0, // 10% discount for some
        totalAmount: totalAmount * 1.1 - (Math.random() > 0.7 ? totalAmount * 0.1 : 0),
        status: status,
        dueDate: new Date(Date.now() + (Math.random() > 0.5 ? 30 : -30) * 24 * 60 * 60 * 1000), // +/- 30 days
        paidDate: paidDate, // Add paidDate for PAID invoices
        paymentMethod: Math.random() > 0.5 ? 'CREDIT_CARD' : 'CASH',
      });
    }
    
    // Add a specific invoice with today's date to ensure we have test data
    const today = new Date();
    // Format the date to match what the database expects
    const formattedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    invoices.push({
      patientId: patients[0].id,
      invoiceNumber: 'INV-TODAY',
      subtotal: 500,
      taxAmount: 50, // 10% tax
      discountAmount: 0,
      totalAmount: 550,
      status: 'PAID',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      paidDate: formattedToday, // Today's date
      paymentMethod: 'CASH',
    });
    
    await models.Invoice.bulkCreate(invoices);
    console.log('Invoices seeded:', invoices.length);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
