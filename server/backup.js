import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, 'backups');
const MAX_BACKUPS_TO_RETAIN = 7;

/**
 * Creates a zero-lock, hot online snapshot of the active SQLite database using VACUUM INTO.
 */
export function createBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `anchor_backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    console.log(`[Backup Engine] Creating hot database snapshot at ${backupPath}...`);
    // SQLite VACUUM INTO copies the active database safely even during concurrent reads and writes
    db.exec(`VACUUM INTO '${backupPath.replace(/'/g, "''")}';`);

    const stats = fs.statSync(backupPath);
    console.log(`[Backup Engine] ✓ Snapshot created successfully (${(stats.size / 1024).toFixed(1)} KB)`);

    // Clean up older backups
    pruneOldBackups();

    return { success: true, backupPath, sizeBytes: stats.size };
  } catch (err) {
    console.error('[Backup Engine] ✗ Database backup failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Retains only the most recent N backup files, deleting older ones.
 */
function pruneOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('anchor_backup_') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS_TO_RETAIN) {
      const toDelete = files.slice(MAX_BACKUPS_TO_RETAIN);
      for (const item of toDelete) {
        fs.unlinkSync(item.path);
        console.log(`[Backup Engine] Pruned old backup: ${item.name}`);
      }
    }
  } catch (err) {
    console.warn('[Backup Engine] Warning during backup retention pruning:', err.message);
  }
}

// Execute directly if run via CLI: node server/backup.js
if (process.argv[1] && process.argv[1].endsWith('backup.js')) {
  createBackup();
}
