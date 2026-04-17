const db = require('../config/database');

const AttackModel = {
  findByCharacterId: (characterId, callback) => {
    db.query('SELECT * FROM attacks WHERE character_id = ? ORDER BY id ASC', [characterId], (err, results) => {
      if (err) return callback(err);
      callback(null, results || []);
    });
  },

  create: (characterId, data, callback) => {
    // ensure legacy required `name` column is populated (use provided name or weapon)
    const sql = `INSERT INTO attacks (character_id, name, weapon, damage_type, range_type, base_pericia, damage, crit_margin, crit_multiplier, ammo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const vals = [
      characterId,
      (data.name || data.weapon || ''),
      data.weapon || null,
      data.damage_type || null,
      data.range_type || 'Adjacente',
      data.base_pericia || null,
      data.damage || null,
      data.crit_margin || null,
      data.crit_multiplier || null,
      data.ammo || null
    ];
    db.query(sql, vals, callback);
  },

  update: (id, data, callback) => {
    const sql = `UPDATE attacks SET name=?, weapon=?, damage_type=?, range_type=?, base_pericia=?, damage=?, crit_margin=?, crit_multiplier=?, ammo=?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const vals = [
      (data.name || data.weapon || ''),
      data.weapon,
      data.damage_type || null,
      data.range_type || 'Adjacente',
      data.base_pericia || null,
      data.damage || null,
      data.crit_margin || null,
      data.crit_multiplier || null,
      data.ammo || null,
      id
    ];
    db.query(sql, vals, callback);
  },

  remove: (id, callback) => {
    db.query('DELETE FROM attacks WHERE id = ?', [id], callback);
  }
};

module.exports = AttackModel;
