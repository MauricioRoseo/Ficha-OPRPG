const db = require('../config/database');

const UserModel = {

  create: (user, callback) => {
    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [user.name, user.email, user.password, user.role || 'player'], callback);
  },

  findByEmail: (email, callback) => {
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.query(sql, [email], callback);
  }

  , findById: (id, callback) => {
    const sql = `SELECT * FROM users WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }

  , findAll: (callback) => {
    const sql = `SELECT id, name, email, role, created_at FROM users ORDER BY id DESC`;
    db.query(sql, callback);
  }

  , update: (id, payload, callback) => {
    const fields = [];
    const values = [];
    if (payload.name !== undefined) { fields.push('name = ?'); values.push(payload.name); }
    if (payload.email !== undefined) { fields.push('email = ?'); values.push(payload.email); }
    if (fields.length === 0) return callback(null, { affectedRows: 0 });
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);
    db.query(sql, values, callback);
  }

  , updatePassword: (id, hashedPassword, callback) => {
    const sql = `UPDATE users SET password = ? WHERE id = ?`;
    db.query(sql, [hashedPassword, id], callback);
  }

  , remove: (id, callback) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    db.query(sql, [id], callback);
  }

};

module.exports = UserModel;