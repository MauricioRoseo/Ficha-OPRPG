const db = require('../config/database');

const LayoutModel = {
  create: (data, callback) => {
    const sql = `INSERT INTO layouts (title, slug, description, is_public, created_by) VALUES (?, ?, ?, ?, ?)`;
    const values = [data.title, data.slug, data.description || null, data.is_public ? 1 : 0, data.created_by];
    db.query(sql, values, callback);
  },

  findById: (id, callback) => {
    db.query('SELECT * FROM layouts WHERE id = ?', [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results && results[0] ? results[0] : null);
    });
  },

  findBySlug: (slug, callback) => {
    db.query('SELECT * FROM layouts WHERE slug = ?', [slug], (err, results) => {
      if (err) return callback(err);
      callback(null, results && results[0] ? results[0] : null);
    });
  },

  update: (id, data, callback) => {
    const sql = `UPDATE layouts SET title = ?, slug = ?, description = ?, is_public = ? WHERE id = ?`;
    const values = [data.title, data.slug, data.description || null, data.is_public ? 1 : 0, id];
    db.query(sql, values, callback);
  },

  remove: (id, callback) => {
    db.query('DELETE FROM layouts WHERE id = ?', [id], callback);
  },

  addCharacter: (layoutId, characterId, positionIndex, callback) => {
    const sql = `INSERT INTO layout_characters (layout_id, character_id, position_index) VALUES (?, ?, ?)`;
    db.query(sql, [layoutId, characterId, positionIndex || 0], callback);
  },

  removeCharacter: (layoutId, characterId, callback) => {
    const sql = `DELETE FROM layout_characters WHERE layout_id = ? AND character_id = ?`;
    db.query(sql, [layoutId, characterId], callback);
  },

  getCharactersForLayout: (layoutId, callback) => {
    const sql = `SELECT lc.position_index, c.* FROM layout_characters lc JOIN characters c ON lc.character_id = c.id WHERE lc.layout_id = ? ORDER BY lc.position_index ASC`;
    db.query(sql, [layoutId], (err, results) => {
      if (err) return callback(err);
      callback(null, results || []);
    });
  },

  getByCreator: (creatorId, callback) => {
    db.query('SELECT * FROM layouts WHERE created_by = ?', [creatorId], (err, results) => {
      if (err) return callback(err);
      callback(null, results || []);
    });
  }
};

module.exports = LayoutModel;
