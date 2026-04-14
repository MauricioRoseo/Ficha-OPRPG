const db = require('../config/database');

const ClassModel = {
  findAll: (callback) => {
    const sql = `SELECT * FROM classes ORDER BY name`;
    db.query(sql, callback);
  },
  findById: (id, callback) => {
    const sql = `SELECT * FROM classes WHERE id = ?`;
    db.query(sql, [id], callback);
  }
};

module.exports = ClassModel;
