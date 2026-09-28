import path from 'path';
import fs from 'fs';

const TEST_DB_PATH = path.join(__dirname, 'test.db');

module.exports = async () => {
  for (const file of [TEST_DB_PATH, `${TEST_DB_PATH}-journal`]) {
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {
      // Windows can briefly hold a file lock on the sqlite file after the
      // last connection closes; harmless since it's gitignored and the next
      // run's global.setup.ts deletes it again before creating a fresh one.
    }
  }
};
