const db = require('../config/database');

const ParanormalModel = {
  findByCharacterId: (characterId, callback) => {
    db.query('SELECT * FROM character_paranormal_encounters WHERE character_id = ? ORDER BY created_at DESC', [characterId], (err, results) => {
      if (err) return callback(err);
      callback(null, results || []);
    });
  },

  create: (characterId, payload, callback) => {
    const sql = 'INSERT INTO character_paranormal_encounters (character_id, title, description, sanity_loss) VALUES (?, ?, ?, ?)';
    const values = [characterId, payload.title || null, payload.description || null, payload.sanity_loss || 0];
    db.query(sql, values, callback);
  },

  update: (id, payload, callback) => {
    const sql = 'UPDATE character_paranormal_encounters SET title = ?, description = ?, sanity_loss = ? WHERE id = ?';
    db.query(sql, [payload.title || null, payload.description || null, payload.sanity_loss || 0, id], callback);
  },

  deleteById: (id, callback) => {
    db.query('DELETE FROM character_paranormal_encounters WHERE id = ?', [id], callback);
  }
  ,

  replaceForCharacter: (characterId, encountersArray, callback) => {
    // encountersArray: [{title, description, sanity_loss}]
    db.query('DELETE FROM character_paranormal_encounters WHERE character_id = ?', [characterId], (err) => {
      if (err) return callback(err);

      if (!encountersArray || encountersArray.length === 0) return callback(null, { affectedRows: 0 });

      const values = encountersArray.map(e => [characterId, e.title || null, e.description || null, e.sanity_loss || 0]);
      const sql = 'INSERT INTO character_paranormal_encounters (character_id, title, description, sanity_loss) VALUES ?';
      db.query(sql, [values], callback);
    });
  }
};

module.exports = ParanormalModel;
