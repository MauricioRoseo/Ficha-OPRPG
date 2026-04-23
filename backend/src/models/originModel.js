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
  ,
  create: (data, callback) => {
    const sql = `INSERT INTO origins (name, description, pericia_1_id, pericia_2_id, habilidade_id) VALUES (?, ?, ?, ?, ?)`;
    const vals = [data.name, data.description || null, data.pericia_1_id || null, data.pericia_2_id || null, data.habilidade_id || null];
    db.query(sql, vals, callback);
  },
  update: (id, data, callback) => {
    const sql = `UPDATE origins SET name = ?, description = ?, pericia_1_id = ?, pericia_2_id = ?, habilidade_id = ? WHERE id = ?`;
    const vals = [data.name, data.description || null, data.pericia_1_id || null, data.pericia_2_id || null, data.habilidade_id || null, id];
    db.query(sql, vals, callback);
  },
  remove: (id, callback) => {
    db.query('DELETE FROM origins WHERE id = ?', [id], callback);
  }
};

module.exports = OriginModel;
