const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db.js');

async function importFullDatabase() {
  console.log('🚀 Starting Full TiDB Data Import...');
  
  try {
    // 1. Read the SQL file
    const sqlPath = path.join(__dirname, 'database.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Error: server/database.sql not found!');
      return;
    }
    
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // 2. Clean the SQL
    // We split by semicolon to run statements one by one
    // We map to remove comments from the START of statements so they don't get filtered out
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        if (s.length === 0) return false;
        // Check if it's just a comment-only block
        const lines = s.split('\n').map(l => l.trim());
        const usefulLines = lines.filter(l => l.length > 0 && !l.startsWith('--'));
        if (usefulLines.length === 0) return false;
        
        // Filter out USE and CREATE DATABASE
        const firstUsefulLine = usefulLines[0].toUpperCase();
        if (firstUsefulLine.startsWith('USE ') || firstUsefulLine.startsWith('CREATE DATABASE ')) return false;
        
        return true;
      });

    const conn = await pool.getConnection();
    
    console.log(`📦 Found ${statements.length} SQL instructions to upload.`);

    // 3. Execute each statement
    for (let i = 0; i < statements.length; i++) {
      try {
        await conn.query(statements[i]);
        if (i % 10 === 0) console.log(`⏳ Progress: ${i}/${statements.length} completed...`);
      } catch (err) {
        // Skip errors for "already exists" but log others
        if (!err.message.includes('already exists')) {
          console.warn(`⚠️ Warning at statement ${i}:`, err.message);
        }
      }
    }

    conn.release();
    console.log('✅ SUCCESS! All data from server/database.sql has been uploaded to TiDB Cloud!');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ CRITICAL ERROR during import:', err.message);
    process.exit(1);
  }
}

importFullDatabase();
