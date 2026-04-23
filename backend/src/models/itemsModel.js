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
  ,
  create: (data, callback) => {
    const sql = `INSERT INTO items_catalog (name, description, space, category, metadata) VALUES (?, ?, ?, ?, ?)`;
    const vals = [data.name, data.description || null, data.space || 0, data.category || null, data.metadata ? JSON.stringify(data.metadata) : null];
    db.query(sql, vals, callback);
  },
  update: (id, data, callback) => {
    const sql = `UPDATE items_catalog SET name = ?, description = ?, space = ?, category = ?, metadata = ? WHERE id = ?`;
    const vals = [data.name, data.description || null, data.space || 0, data.category || null, data.metadata ? JSON.stringify(data.metadata) : null, id];
    db.query(sql, vals, callback);
  },
  remove: (id, callback) => {
    db.query('DELETE FROM items_catalog WHERE id = ?', [id], callback);
  }
};

module.exports = ItemsModel;
