const db = require('../config/database');

const ensureCharacterRitualsFlag = () => {
  const sql = `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'character_rituals' AND COLUMN_NAME = 'granted_by_level'`;
  db.query(sql, [], (err, rows) => {
    if (err) return console.error('[migrations] error checking character_rituals columns:', err && err.message);
    const c = (rows && rows[0] && rows[0].c) ? rows[0].c : 0;
    if (c === 0) {
      const alter = `ALTER TABLE character_rituals ADD COLUMN granted_by_level TINYINT DEFAULT 0`;
      db.query(alter, [], (err2) => {
        if (err2) return console.error('[migrations] error adding granted_by_level column:', err2 && err2.message);
        console.log('✔ Migration: added character_rituals.granted_by_level');
      });
    }
  });
};

module.exports = { ensureCharacterRitualsFlag };
