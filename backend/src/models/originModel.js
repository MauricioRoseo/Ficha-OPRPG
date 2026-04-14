const db = require('../config/database');

const OriginModel = {
  findAll: (callback) => {
    const sql = `SELECT * FROM origins ORDER BY name`;
    db.query(sql, callback);
  },
  findById: (id, callback) => {
    const sql = `SELECT * FROM origins WHERE id = ?`;
    db.query(sql, [id], callback);
  }
};

module.exports = OriginModel;
