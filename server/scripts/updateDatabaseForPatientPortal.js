const pool = require('../config/db');

async function createPortalTable() {
  try {
    console.log('🔄 Updating database for Patient Portal...');

    // 1. Add user_id to patients table if not exists (to link users to their medical records)
    // First, check if column exists
    const [cols] = await pool.query("SHOW COLUMNS FROM patients LIKE 'user_id'");
    if (cols.length === 0) {
      console.log('➕ Adding user_id to patients table...');
      await pool.query('ALTER TABLE patients ADD COLUMN user_id INT AFTER id');
      await pool.query('ALTER TABLE patients ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');
    }

    // 2. Create patient_portal table as requested
    // This table can store portal-specific data like login history, preferences, etc.
    const createPortalSql = `
      CREATE TABLE IF NOT EXISTS patient_portal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        user_id INT NOT NULL,
        portal_username VARCHAR(100),
        status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
        allow_telehealth TINYINT(1) DEFAULT 1,
        allow_messaging TINYINT(1) DEFAULT 1,
        last_portal_login TIMESTAMP NULL,
        preferences JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(patient_id),
        UNIQUE(user_id)
      )
    `;
    await pool.query(createPortalSql);
    console.log('✅ patient_portal table created successfully!');

    // 3. Create a messages table since the portal UI uses it
    const createMessagesSql = `
      CREATE TABLE IF NOT EXISTS patient_portal_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await pool.query(createMessagesSql);
    console.log('✅ patient_portal_messages table created successfully!');

    console.log('🚀 Database update complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  }
}

createPortalTable();
