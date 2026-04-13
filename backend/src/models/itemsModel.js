const db = require('../config/database');

const ItemsModel = {
  search: (q, callback) => {
    const sql = `SELECT * FROM items_catalog WHERE name LIKE ? OR description LIKE ? LIMIT 50`;
    const like = `%${q}%`;
    db.query(sql, [like, like], callback);
  },

  findById: (id, callback) => {
    const sql = `SELECT * FROM items_catalog WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }
};

module.exports = ItemsModel;
