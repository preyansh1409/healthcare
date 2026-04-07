const pool = require('../config/db');

async function fixLinks() {
  // Get all patients with no user_id
  const [patients] = await pool.query('SELECT id, name, phone FROM patients WHERE user_id IS NULL');
  process.stdout.write(`Found ${patients.length} unlinked patient(s)\n`);

  for (const p of patients) {
    // Look for a user with matching phone
    const [users] = await pool.query('SELECT id FROM users WHERE phone = ?', [p.phone]);
    if (users.length) {
      await pool.query('UPDATE patients SET user_id = ? WHERE id = ?', [users[0].id, p.id]);
      process.stdout.write(`Linked patient "${p.name}" (id=${p.id}) => user_id=${users[0].id}\n`);
    } else {
      process.stdout.write(`No user found for patient "${p.name}" (phone=${p.phone}) - they must log in via OTP first\n`);
    }
  }

  // Also check patient-role users not linked to any patient
  const [patientUsers] = await pool.query('SELECT id, name, phone FROM users WHERE role = "patient"');
  for (const u of patientUsers) {
    const [linked] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [u.id]);
    if (!linked.length) {
      const [matchPatient] = await pool.query('SELECT id FROM patients WHERE phone = ?', [u.phone]);
      if (matchPatient.length) {
        await pool.query('UPDATE patients SET user_id = ? WHERE id = ?', [u.id, matchPatient[0].id]);
        process.stdout.write(`Linked user "${u.name}" (id=${u.id}) => patient_id=${matchPatient[0].id}\n`);
      }
    }
  }

  // Final check
  const [final] = await pool.query(`
    SELECT u.id as user_id, u.name, u.phone, p.id as patient_id
    FROM users u
    LEFT JOIN patients p ON u.id = p.user_id
    WHERE u.role = 'patient'
  `);
  process.stdout.write('FINAL STATE:\n' + JSON.stringify(final, null, 2) + '\n');
  process.exit(0);
}

fixLinks().catch(e => {
  process.stdout.write('ERROR: ' + e.message + '\n');
  process.exit(1);
});
