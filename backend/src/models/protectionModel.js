const db = require('../config/database');

const ProtectionModel = {
  findByCharacterId: (characterId, callback) => {
    const sql = `SELECT * FROM protections WHERE character_id = ? ORDER BY id`;
    db.query(sql, [characterId], callback);
  },

  findById: (id, callback) => {
    const sql = `SELECT * FROM protections WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  update: (id, data, callback) => {
    const fields = [];
    const values = [];

    if (data.equipped !== undefined) {
      fields.push('equipped = ?');
      values.push(data.equipped ? 1 : 0);
    }

    if (fields.length === 0) return callback(null, { affectedRows: 0 });

    const sql = `UPDATE protections SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    db.query(sql, values, callback);
  }
};

module.exports = ProtectionModel;

// create a new protection
ProtectionModel.create = (data, callback) => {
  const sql = `
    INSERT INTO protections (
      character_id, equipped, name, passive_defense, damage_resistance, encumbrance_penalty, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.character_id,
    data.equipped ? 1 : 0,
    data.name,
    data.passive_defense || 0,
    data.damage_resistance || 0,
    data.encumbrance_penalty || 0,
    data.notes || null
  ];

  db.query(sql, values, callback);
};
