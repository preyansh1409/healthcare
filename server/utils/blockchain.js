const crypto = require('crypto');
const pool = require('../config/db');

/**
 * A simple Blockchain implementation for Medical Records
 * Ensures that clinical data like prescriptions and admissions are immutable.
 */
class MedicalBlock {
  static calculateHash(index, previousHash, timestamp, data) {
    return crypto
      .createHash('sha256')
      .update(index + previousHash + timestamp + JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Records a new clinical activity into the immutable ledger
   * @param {string} activityType - 'PRESCRIPTION', 'ADMISSION', 'BILLING', etc.
   * @param {object} detail - The data to store (patient id, doctor info, etc.)
   */
  static async recordActivity(activityType, detail) {
    try {
      // 1. Get the last block to find its hash
      const [[lastBlock]] = await pool.query('SELECT * FROM blockchain_ledger ORDER BY id DESC LIMIT 1');
      
      const index = lastBlock ? lastBlock.id + 1 : 1;
      const previousHash = lastBlock ? lastBlock.hash : '00000000000000000000000000000000';
      const timestamp = new Date().toISOString();
      const data = { type: activityType, ...detail };
      
      const currentHash = this.calculateHash(index, previousHash, timestamp, data);
      
      // 2. Insert into the database
      await pool.query(
        'INSERT INTO blockchain_ledger (id, previous_hash, hash, timestamp, data) VALUES (?, ?, ?, ?, ?)',
        [index, previousHash, currentHash, timestamp, JSON.stringify(data)]
      );
      
      console.log(`[BLOCKCHAIN] New block added (#${index}) for ${activityType}`);
      return currentHash;
    } catch (err) {
      console.error('[BLOCKCHAIN ERROR]', err.message);
      return null;
    }
  }

  /**
   * Verifies the integrity of the entire chain and compares it against live data
   */
  static async verifyChain() {
    try {
      const [blocks] = await pool.query('SELECT * FROM blockchain_ledger ORDER BY id ASC');
      let isVerified = true;
      let tamperedBlockId = null;
      let error = null;

      const report = await Promise.all(blocks.map(async (currentBlock, i) => {
        const previousBlock = i > 0 ? blocks[i - 1] : null;
        let isValid = true;
        let blockErrorMessage = null;
        const blockData = JSON.parse(currentBlock.data);

        // Check 1: Previous hash link
        if (i > 0) {
          if (currentBlock.previous_hash !== previousBlock.hash) {
            isValid = false;
            blockErrorMessage = "Chain link broken (Hash mismatch)";
          }
        }

        // Check 2: Hash validity (Re-calculate and compare block integrity)
        const recalculatedHash = this.calculateHash(
          currentBlock.id, 
          currentBlock.previous_hash, 
          currentBlock.timestamp, 
          blockData
        );
        
        if (currentBlock.hash !== recalculatedHash) {
          isValid = false;
          blockErrorMessage = "LEDGER TAMPERED: This record was illegally modified in the audit table.";
        }

        // Check 3: Live Data Consistency (Deep Audit)
        // We compare the blockchain snapshot to the ACTUAL living database data
        if (isValid) {
          const type = blockData.type;
          
          if (type === 'PRESCRIPTION') {
            const [[live]] = await pool.query('SELECT * FROM prescriptions WHERE id = ?', [blockData.prescriptionId]);
            if (!live || (live.diagnosis !== blockData.diagnosis)) {
              isValid = false;
              blockErrorMessage = "PRESCRIPTION TAMPERED!";
            }
          } else if (type === 'ADMISSION') {
            const [[live]] = await pool.query('SELECT * FROM beds WHERE id = ?', [blockData.bedId]);
            if (!live || (live.ward !== blockData.ward)) {
              isValid = false;
              blockErrorMessage = "ADMISSION TAMPERED!";
            }
          } else if (type === 'USER_CREATE' || type === 'DOCTOR_UPDATE') {
            const [[live]] = await pool.query('SELECT name, email FROM users WHERE id = ?', [blockData.userId]);
            if (live && live.name !== blockData.name) {
              isValid = false;
              blockErrorMessage = "USER/DOCTOR PROFILE TAMPERED!";
            }
          } else if (type === 'PATIENT_CREATE' || type === 'PATIENT_UPDATE') {
            const [[live]] = await pool.query('SELECT name, phone FROM patients WHERE id = ?', [blockData.id]);
            if (live && live.name !== blockData.name) {
              isValid = false;
              blockErrorMessage = "PATIENT PROFILE TAMPERED!";
            }
          } else if (type === 'APPOINTMENT_CREATE') {
            const [[live]] = await pool.query('SELECT id FROM appointments WHERE id = ?', [blockData.appointmentId]);
            if (!live) {
              isValid = false;
              blockErrorMessage = "APPOINTMENT RECORD DELETED!";
            }
          } else if (type === 'BILL_CREATE') {
            const [[live]] = await pool.query('SELECT total_amount FROM billing WHERE id = ?', [blockData.billId]);
            if (live && parseFloat(live.total_amount) !== parseFloat(blockData.amount)) {
              isValid = false;
              blockErrorMessage = "BILLING AMOUNT TAMPERED!";
            }
          }
        }

        if (!isValid) {
          isVerified = false;
          if (!tamperedBlockId) tamperedBlockId = currentBlock.id;
          if (!error) error = blockErrorMessage;
        }

        return {
          id: currentBlock.id,
          isValid,
          errorMessage: blockErrorMessage
        };
      }));
      
      return { 
        valid: isVerified, 
        count: blocks.length, 
        tamperedBlockId,
        error,
        report 
      };
    } catch (err) {
      console.error('[AUDIT FAILED]', err.message);
      return { valid: false, error: 'Internal Audit Failure: ' + err.message };
    }
  }
}

module.exports = MedicalBlock;
