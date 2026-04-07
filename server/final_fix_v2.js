import fs from 'fs';

let authPath = 'c:/Users/preya/OneDrive/Documents/Desktop/project/server/controllers/authController.js';
let authContent = fs.readFileSync(authPath, 'utf8');

// Update getMe to fetch all patient fields
authContent = authContent.replace(
    /SELECT u\.id, u\.name, u\.email, u\.role,[\s\S]*?p\.age\s+FROM users u/m,
    `SELECT u.id, u.name, u.email, u.role, 
              d.specialization, d.id as doctor_id, 
              p.*, p.id as patient_id
       FROM users u`
);

// Update verifyOTPAndLogin to fetch all patient fields
authContent = authContent.replace(
    /SELECT id as patient_id, name, age, gender, birth\_date, blood\_group, address, phone, emergency\_contact/,
    `SELECT *, id as patient_id`
);

// Update verifyOTPAndLogin user object (single profile case)
authContent = authContent.replace(
    /user: \{\s*id: userId,[\s\S]*?emergency\_contact: profiles\[0\]\.emergency\_contact,[\s\S]*?age: profiles\[0\]\.age\s*\}/m,
    `user: {
        id: userId,
        email,
        role: 'patient',
        ...profiles[0]
      }`
);

fs.writeFileSync(authPath, authContent, 'utf8');
console.log('authController.js updated to fetch all patient fields.');
