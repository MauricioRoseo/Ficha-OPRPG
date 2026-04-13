const db = require('../config/database');

const InventoryModel = {
  create: (data, callback) => {
    const sql = `
      INSERT INTO inventory (character_id, name, description, space, category)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [data.character_id, data.name, data.description || null, data.space || 0, data.category || null];
    db.query(sql, values, callback);
  },

  findByCharacterId: (characterId, callback) => {
    const sql = `SELECT * FROM inventory WHERE character_id = ? ORDER BY id ASC`;
    db.query(sql, [characterId], callback);
  },

  findById: (id, callback) => {
    const sql = `SELECT * FROM inventory WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  update: (id, data, callback) => {
    const sql = `
      UPDATE inventory SET name = ?, description = ?, space = ?, category = ? WHERE id = ?
    `;
    const values = [data.name, data.description || null, data.space || 0, data.category || null, id];
    db.query(sql, values, callback);
  },

  deleteById: (id, callback) => {
    const sql = `DELETE FROM inventory WHERE id = ?`;
    db.query(sql, [id], callback);
  }
};

module.exports = InventoryModel;
