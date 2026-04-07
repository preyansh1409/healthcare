import fs from 'fs';

// 1. AuthController.js
let authPath = 'c:/Users/preya/OneDrive/Documents/Desktop/project/server/controllers/authController.js';
let authContent = fs.readFileSync(authPath, 'utf8');

// Update getMe
authContent = authContent.replace(
    /SELECT u\.id, u\.name, u\.email, u\.role, u\.phone,[\s\S]*?p\.id as patient_id[\s\S]*?FROM users u/m,
    `SELECT u.id, u.name, u.email, u.role, 
              d.specialization, d.id as doctor_id, 
              p.id as patient_id, p.birth_date, p.blood_group, p.address, p.phone, p.emergency_contact, p.age
       FROM users u`
);

// Update verifyOTPAndLogin
authContent = authContent.replace(
    /SELECT id as patient_id, name, age, gender, birth\_date, blood\_group[\s\S]*?FROM patients WHERE user\_id = \?/,
    `SELECT id as patient_id, name, age, gender, birth_date, blood_group, address, phone, emergency_contact
       FROM patients WHERE user_id = ?`
);

// Update verifyOTPAndLogin user object (single profile case)
authContent = authContent.replace(
    /patient\_id: profiles\[0\]\.patient\_id[\s\S]*?\}/m,
    `patient_id: profiles[0].patient_id,
        birth_date: profiles[0].birth_date,
        blood_group: profiles[0].blood_group,
        address: profiles[0].address,
        phone: profiles[0].phone,
        emergency_contact: profiles[0].emergency_contact,
        age: profiles[0].age
      }`
);

fs.writeFileSync(authPath, authContent, 'utf8');

// 2. AuthContext.jsx
let ctxPath = 'c:/Users/preya/OneDrive/Documents/Desktop/project/client/src/context/AuthContext.jsx';
let ctxContent = fs.readFileSync(ctxPath, 'utf8');
if (!ctxContent.includes('loadUser,')) {
    ctxContent = ctxContent.replace('loginUser, logout, isAdmin', 'loginUser, logout, loadUser, isAdmin');
}
fs.writeFileSync(ctxPath, ctxContent, 'utf8');

// 3. PatientController.js
let patPath = 'c:/Users/preya/OneDrive/Documents/Desktop/project/server/controllers/patientController.js';
let patContent = fs.readFileSync(patPath, 'utf8');
if (!patContent.includes('// Sync with users table')) {
    patContent = patContent.replace(
        /await pool\.query\([\s\S]*?UPDATE patients SET[\s\S]*?req\.params\.id\][\s\S]*?\);/m,
        `await pool.query(
      'UPDATE patients SET name=?, age=?, gender=?, phone=?, email=?, address=?, blood_group=?, allergies=?, emergency_contact=?, birth_date=? WHERE id=?',
      [name, age, gender, phone, email, address, blood_group, allergies, emergency_contact, birth_date, req.params.id]
    );

    // Sync with users table if linked
    const [patient] = await pool.query('SELECT user_id FROM patients WHERE id = ?', [req.params.id]);
    if (patient[0]?.user_id) {
       await pool.query('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, patient[0].user_id]);
    }`
    );
}
fs.writeFileSync(patPath, patContent, 'utf8');

console.log('Backend and Context updated.');
