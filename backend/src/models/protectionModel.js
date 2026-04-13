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

// Create a protection for a character by copying fields from a template
ProtectionModel.createFromTemplate = (templateRow, characterId, overrides, callback) => {
  // templateRow is an object from protection_templates
  const sql = `
    INSERT INTO protections (
      character_id, template_id, equipped, name, passive_defense, damage_resistance, encumbrance_penalty, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    characterId,
    templateRow.id,
    overrides && overrides.equipped !== undefined ? (overrides.equipped ? 1 : 0) : (templateRow.default_equipped ? 1 : 0),
    overrides && overrides.name ? overrides.name : templateRow.name,
    overrides && overrides.passive_defense !== undefined ? overrides.passive_defense : (templateRow.passive_defense || 0),
    overrides && overrides.damage_resistance !== undefined ? overrides.damage_resistance : (templateRow.damage_resistance || 0),
    overrides && overrides.encumbrance_penalty !== undefined ? overrides.encumbrance_penalty : (templateRow.encumbrance_penalty || 0),
    overrides && overrides.notes ? overrides.notes : (templateRow.description || null)
  ];

  db.query(sql, values, callback);
};

// delete a protection by id
ProtectionModel.deleteById = (id, callback) => {
  const sql = `DELETE FROM protections WHERE id = ?`;
  db.query(sql, [id], callback);
};
