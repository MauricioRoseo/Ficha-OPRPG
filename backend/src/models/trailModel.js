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
};

module.exports = TrailModel;
