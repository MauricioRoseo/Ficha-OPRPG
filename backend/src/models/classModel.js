const db = require('../config/database');

const ClassModel = {
  findAll: (callback) => {
    const sql = `SELECT * FROM classes ORDER BY name`;
    db.query(sql, callback);
  },
  findById: (id, callback) => {
    const sql = `SELECT * FROM classes WHERE id = ?`;
    db.query(sql, [id], callback);
  },
  create: (data, callback) => {
    const sql = `INSERT INTO classes (name, description, hp_initial, hp_per_level, effort_initial, effort_per_level, sanity_initial, sanity_per_level, choice_skills_count, proficiencies, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const prof = data.proficiencies ? JSON.stringify(data.proficiencies) : null;
    const meta = data.metadata ? JSON.stringify(data.metadata) : null;
    const vals = [
      data.name,
      data.description || null,
      data.hp_initial || 0,
      data.hp_per_level || 0,
      data.effort_initial || 0,
      data.effort_per_level || 0,
      data.sanity_initial || 0,
      data.sanity_per_level || 0,
      data.choice_skills_count || 0,
      prof,
      meta
    ];
    db.query(sql, vals, callback);
  },
  update: (id, data, callback) => {
    const sql = `UPDATE classes SET name = ?, description = ?, hp_initial = ?, hp_per_level = ?, effort_initial = ?, effort_per_level = ?, sanity_initial = ?, sanity_per_level = ?, choice_skills_count = ?, proficiencies = ?, metadata = ? WHERE id = ?`;
    const prof = data.proficiencies ? JSON.stringify(data.proficiencies) : null;
    const meta = data.metadata ? JSON.stringify(data.metadata) : null;
    const vals = [
      data.name,
      data.description || null,
      data.hp_initial || 0,
      data.hp_per_level || 0,
      data.effort_initial || 0,
      data.effort_per_level || 0,
      data.sanity_initial || 0,
      data.sanity_per_level || 0,
      data.choice_skills_count || 0,
      prof,
      meta,
      id
    ];
    db.query(sql, vals, callback);
  },
  remove: (id, callback) => {
    db.query('DELETE FROM classes WHERE id = ?', [id], callback);
  }
};

module.exports = ClassModel;
