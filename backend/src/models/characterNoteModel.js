const db = require('../config/database');

const CharacterNoteModel = {
  findByCharacterId: (characterId, callback) => {
    const sql = `SELECT * FROM character_notes WHERE character_id = ? ORDER BY updated_at DESC`;
    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);
      callback(null, results || []);
    });
  },

  findById: (id, callback) => {
    db.query('SELECT * FROM character_notes WHERE id = ? LIMIT 1', [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  },

  create: (characterId, payload, callback) => {
    const sql = `INSERT INTO character_notes (character_id, title, content, metadata) VALUES (?, ?, ?, ?)`;
    const values = [characterId, payload.title || null, payload.content || null, payload.metadata ? JSON.stringify(payload.metadata) : null];
    db.query(sql, values, callback);
  },

  update: (id, payload, callback) => {
    const sql = `UPDATE character_notes SET title = ?, content = ?, metadata = ? WHERE id = ?`;
    const values = [payload.title || null, payload.content || null, payload.metadata ? JSON.stringify(payload.metadata) : null, id];
    db.query(sql, values, callback);
  },

  deleteById: (id, callback) => {
    db.query('DELETE FROM character_notes WHERE id = ?', [id], callback);
  }
};

module.exports = CharacterNoteModel;
