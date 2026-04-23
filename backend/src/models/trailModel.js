const db = require('../config/database');

const TrailModel = {
  findByClassId: (classId, callback) => {
    const sql = `SELECT * FROM trails WHERE class_id = ? ORDER BY name`;
    db.query(sql, [classId], callback);
  },
  findAll: (callback) => {
    const sql = `SELECT * FROM trails ORDER BY name`;
    db.query(sql, callback);
  }
  ,
  create: (data, callback) => {
    const sql = `INSERT INTO trails (class_id, name, description, ability_lvl_2_id, ability_lvl_8_id, ability_lvl_13_id, ability_lvl_20_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const vals = [
      data.class_id || null,
      data.name,
      data.description || null,
      data.ability_lvl_2_id || null,
      data.ability_lvl_8_id || null,
      data.ability_lvl_13_id || null,
      data.ability_lvl_20_id || null
    ];
    db.query(sql, vals, callback);
  },
  update: (id, data, callback) => {
    const sql = `UPDATE trails SET class_id = ?, name = ?, description = ?, ability_lvl_2_id = ?, ability_lvl_8_id = ?, ability_lvl_13_id = ?, ability_lvl_20_id = ? WHERE id = ?`;
    const vals = [
      data.class_id || null,
      data.name,
      data.description || null,
      data.ability_lvl_2_id || null,
      data.ability_lvl_8_id || null,
      data.ability_lvl_13_id || null,
      data.ability_lvl_20_id || null,
      id
    ];
    db.query(sql, vals, callback);
  },
  remove: (id, callback) => {
    db.query('DELETE FROM trails WHERE id = ?', [id], callback);
  }
};

module.exports = TrailModel;
