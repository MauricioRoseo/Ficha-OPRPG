const db = require('../config/database');

const ProtectionTemplateModel = {
  findAll: (callback) => {
    const sql = `SELECT * FROM protection_templates ORDER BY name`;
    db.query(sql, callback);
  },

  findById: (id, callback) => {
    const sql = `SELECT * FROM protection_templates WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  create: (data, callback) => {
    const sql = `
      INSERT INTO protection_templates (
        name, description, passive_defense, damage_resistance, encumbrance_penalty, default_equipped, metadata, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.name,
      data.description || null,
      data.passive_defense || 0,
      data.damage_resistance || 0,
      data.encumbrance_penalty || 0,
      data.default_equipped ? 1 : 0,
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.created_by || null
    ];

    db.query(sql, values, callback);
  }
};

module.exports = ProtectionTemplateModel;
