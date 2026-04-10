const db = require('../config/database');

const FeatureModel = {

  create: (data, callback) => {
    const sql = `
      INSERT INTO features (name, type, description, metadata)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      data.name,
      data.type,
      data.description || null,
      JSON.stringify(data.metadata || {})
    ];

    db.query(sql, values, callback);
  },

  findAll: (callback) => {
    db.query('SELECT * FROM features', (err, results) => {
      if (err) return callback(err);

      // 🔥 parse do JSON
      const parsed = results.map(f => ({
        ...f,
        metadata:
          typeof f.metadata === "string"
            ? JSON.parse(f.metadata)
            : f.metadata || {}
      }));

      callback(null, parsed);
    });
  },

  addToCharacter: (characterId, featureId, data, callback) => {
    const sql = `
      INSERT INTO character_features
      (character_id, feature_id, value, training_level, extra, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      characterId,
      featureId,
      data.value || 0,
      data.training_level || 'none',
      data.extra || 0,
      data.notes || null
    ];

    db.query(sql, values, callback);
  },

  getByCharacter: (characterId, callback) => {
    const sql = `
      SELECT cf.*, f.name, f.type, f.description, f.metadata
      FROM character_features cf
      JOIN features f ON cf.feature_id = f.id
      WHERE cf.character_id = ?
    `;

    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);

      // 🔥 parse metadata
      const parsed = results.map(f => ({
        ...f,
        metadata:
          typeof f.metadata === "string"
            ? JSON.parse(f.metadata)
            : f.metadata || {}
      }));

      callback(null, parsed);
    });
  }

};

module.exports = FeatureModel;