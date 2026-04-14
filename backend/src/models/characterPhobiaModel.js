const db = require('../config/database');

const CharacterPhobiaModel = {
  findByCharacterId: (characterId, callback) => {
    const sql = `SELECT cp.*, p.name AS phobia_name, p.short_description AS phobia_short_description, p.detailed_description AS phobia_detailed_description FROM character_phobias cp LEFT JOIN phobias p ON cp.phobia_id = p.id WHERE cp.character_id = ? ORDER BY cp.id`;
    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);
      callback(null, results || []);
    });
  },

  // create a phobia entry for a character (either phobia_id or custom fields)
  create: (characterId, payload, callback) => {
    const sql = `INSERT INTO character_phobias (character_id, phobia_id, custom_name, custom_short_description, custom_detailed_description) VALUES (?, ?, ?, ?, ?)`;
    const values = [
      characterId,
      payload.phobia_id || null,
      payload.custom_name || null,
      payload.custom_short_description || null,
      payload.custom_detailed_description || null,
    ];
    db.query(sql, values, callback);
  },

  deleteById: (id, callback) => {
    db.query('DELETE FROM character_phobias WHERE id = ?', [id], callback);
  },

  // replace all phobias for a character (simple helper): remove existing and insert new list
  replaceForCharacter: (characterId, phobiasArray, callback) => {
    // phobiasArray: [{phobia_id}|{custom_name, ...}]
    db.query('DELETE FROM character_phobias WHERE character_id = ?', [characterId], (err) => {
      if (err) return callback(err);

      if (!phobiasArray || phobiasArray.length === 0) return callback(null, { affectedRows: 0 });

      const values = phobiasArray.map(p => [characterId, p.phobia_id || null, p.custom_name || null, p.custom_short_description || null, p.custom_detailed_description || null]);
      const sql = 'INSERT INTO character_phobias (character_id, phobia_id, custom_name, custom_short_description, custom_detailed_description) VALUES ?';
      db.query(sql, [values], callback);
    });
  }
};

module.exports = CharacterPhobiaModel;
