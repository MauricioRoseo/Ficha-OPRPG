const db = require('../config/database');

const PhobiaModel = {
  findAll: (callback) => {
    db.query('SELECT * FROM phobias ORDER BY name', callback);
  },

  findById: (id, callback) => {
    db.query('SELECT * FROM phobias WHERE id = ? LIMIT 1', [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  },

  create: (payload, callback) => {
    const sql = 'INSERT INTO phobias (name, short_description, detailed_description) VALUES (?, ?, ?)';
    db.query(sql, [payload.name, payload.short_description || null, payload.detailed_description || null], callback);
  }
};

module.exports = PhobiaModel;
