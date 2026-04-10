const db = require('../config/database');

const UserModel = {

  create: (user, callback) => {
    const sql = `
      INSERT INTO users (name, email, password)
      VALUES (?, ?, ?)
    `;

    db.query(sql, [user.name, user.email, user.password], callback);
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

};

module.exports = UserModel;