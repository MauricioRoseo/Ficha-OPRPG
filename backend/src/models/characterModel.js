const db = require('../config/database');

const CharacterModel = {
  create: (data, callback) => {
    const sql = `
      INSERT INTO characters 
      (user_id, name, idade, classe, trilha, origem, nex, nivel)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.user_id,
      data.name,
      data.idade,
      data.classe,
      data.trilha,
      data.origem,
      data.nex,
      data.nivel
    ];

    db.query(sql, values, callback);
  },

  findAll: (callback) => {
    db.query('SELECT * FROM characters', callback);
  }
};

module.exports = CharacterModel;