const db = require('../config/database');

const AttributeModel = {
  create: (characterId, callback) => {
    const sql = `
      INSERT INTO attributes (character_id)
      VALUES (?)
    `;

    db.query(sql, [characterId], callback);
  },

  findByCharacterId: (characterId, callback) => {
    const sql = `
      SELECT * FROM attributes WHERE character_id = ?
    `;

    db.query(sql, [characterId], callback);
  },

  update: (characterId, data, callback) => {
    const sql = `
      UPDATE attributes
      SET forca = ?, agilidade = ?, intelecto = ?, vigor = ?, presenca = ?
      WHERE character_id = ?
    `;

    const values = [
      data.forca,
      data.agilidade,
      data.intelecto,
      data.vigor,
      data.presenca,
      characterId
    ];

    db.query(sql, values, callback);
  }
};

module.exports = AttributeModel;