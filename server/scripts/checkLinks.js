const pool = require('../config/db');

async function diagnose() {
  // Check patients table for phone 1234567890
  const [p1] = await pool.query('SELECT id, name, phone, user_id FROM patients WHERE phone = ?', ['1234567890']);
  process.stdout.write('Patient with phone 1234567890:\n' + JSON.stringify(p1) + '\n');
  
  // Check patients table for phone 9825421676
  const [p2] = await pool.query('SELECT id, name, phone, user_id FROM patients WHERE phone = ?', ['9825421676']);
  process.stdout.write('Patient with phone 9825421676:\n' + JSON.stringify(p2) + '\n');
  
  // All patients
  const [all] = await pool.query('SELECT id, name, phone, user_id FROM patients');
  process.stdout.write('ALL patients:\n' + JSON.stringify(all, null, 2) + '\n');
  
  // Appointments for patient 15
  const [appts] = await pool.query('SELECT id, patient_id, appointment_date, status FROM appointments WHERE patient_id = 15 LIMIT 5');
  process.stdout.write('Appointments for patient 15:\n' + JSON.stringify(appts) + '\n');
  
  // Prescriptions for patient 15
  const [pres] = await pool.query('SELECT id, patient_id, diagnosis FROM prescriptions WHERE patient_id = 15 LIMIT 5');
  process.stdout.write('Prescriptions for patient 15:\n' + JSON.stringify(pres) + '\n');
  
  // Billing for patient 15
  const [bills] = await pool.query('SELECT id, patient_id, total_amount, status FROM billing WHERE patient_id = 15 LIMIT 5');
  process.stdout.write('Bills for patient 15:\n' + JSON.stringify(bills) + '\n');
  
  process.exit(0);
}
diagnose().catch(e => { process.stdout.write('ERROR: ' + e.message + '\n'); process.exit(1); });
