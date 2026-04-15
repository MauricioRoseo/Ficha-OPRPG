const db = require('../config/database');

const FeatureModel = {

  create: (data, callback) => {
    const sql = `
      INSERT INTO features (name, type, description, origin, metadata, has_encumbrance_penalty, encumbrance_penalty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.name,
      data.type,
      data.description || null,
      data.origin || null,
      JSON.stringify(data.metadata || {}),
      data.has_encumbrance_penalty ? 1 : 0,
      (data.has_encumbrance_penalty ? (data.encumbrance_penalty || 0) : null)
    ];

    db.query(sql, values, callback);
  },

  findById: (id, callback) => {
    db.query('SELECT * FROM features WHERE id = ?', [id], (err, results) => {
      if (err) return callback(err);
      if (!results || results.length === 0) return callback(null, null);
      const f = results[0];
      f.metadata = typeof f.metadata === 'string' ? JSON.parse(f.metadata) : f.metadata || {};
      f.has_encumbrance_penalty = f.has_encumbrance_penalty ? 1 : 0;
      f.encumbrance_penalty = f.encumbrance_penalty !== null ? Number(f.encumbrance_penalty) : null;
      callback(null, f);
    });
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

  // Adds a feature to a character. Supports snapshotting template data into the row
  addToCharacter: (characterId, featureId, data, callback) => {
    const sql = `
      INSERT INTO character_features
      (character_id, feature_id, value, training_level, extra, notes, template_id, template_name, template_description, template_metadata, encumbrance_penalty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      characterId,
      featureId,
      data.value || 0,
      data.training_level || 'none',
      data.extra || 0,
      data.notes || null,
      data.template_id || null,
      data.template_name || null,
      data.template_description || null,
      data.template_metadata ? JSON.stringify(data.template_metadata) : null,
      // encumbrance_penalty: charactersupport: if feature supports encumbrance, default to provided or 0; otherwise null
      (data.has_encumbrance_penalty ? (data.encumbrance_penalty || 0) : null)
    ];

    db.query(sql, values, callback);
  },

  // Increment encumbrance_penalty for all character_features that support it (encumbrance_penalty IS NOT NULL)
  incrementEncumbranceForCharacter: (characterId, delta, callback) => {
    if (!delta || Number(delta) === 0) return callback(null, { affectedRows: 0 });
    const sql = `UPDATE character_features SET encumbrance_penalty = GREATEST(0, IFNULL(encumbrance_penalty,0) + ?) WHERE character_id = ? AND encumbrance_penalty IS NOT NULL`;
    db.query(sql, [delta, characterId], callback);
  },

  getByCharacter: (characterId, callback) => {
    const sql = `
      SELECT cf.*, f.name AS feature_name, f.type, f.description AS feature_description, f.origin AS feature_origin, f.metadata AS feature_metadata, f.has_encumbrance_penalty, f.encumbrance_penalty AS feature_encumbrance
      FROM character_features cf
      LEFT JOIN features f ON cf.feature_id = f.id
      WHERE cf.character_id = ?
    `;

    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);

      // parse metadata and prefer template_metadata (snapshot) if present
      const parsed = results.map(row => {
        // row.template_metadata may be string
        const templateMeta = row.template_metadata ? (typeof row.template_metadata === 'string' ? JSON.parse(row.template_metadata) : row.template_metadata) : null;
        const featureMeta = row.feature_metadata ? (typeof row.feature_metadata === 'string' ? JSON.parse(row.feature_metadata) : row.feature_metadata) : null;

        // Build resulting object similar to prior shape but include template snapshot fields
        return {
          id: row.id,
          character_id: row.character_id,
          feature_id: row.feature_id,
          value: row.value,
          training_level: row.training_level,
          extra: row.extra,
          notes: row.notes,
          encumbrance_penalty: row.encumbrance_penalty !== null ? Number(row.encumbrance_penalty) : null,
          // if template snapshot exists, prefer those values; otherwise fallback to feature table
          name: row.template_name || row.feature_name,
          type: row.type,
          description: row.template_description || row.feature_description,
          origin: row.template_metadata && (row.template_metadata.origin || row.template_metadata.source) ? (row.template_metadata.origin || row.template_metadata.source) : (row.feature_origin || null),
          metadata: templateMeta || featureMeta || {},
          template_id: row.template_id || null
        };
      });

      callback(null, parsed);
    });
  }

  ,

  removeCharacterFeature: (id, callback) => {
    const sql = `DELETE FROM character_features WHERE id = ?`;
    db.query(sql, [id], callback);
  }

  ,

  updateCharacterFeature: (id, data, callback) => {
    const sql = `UPDATE character_features SET value = ?, training_level = ?, extra = ?, notes = ?, encumbrance_penalty = ? WHERE id = ?`;
    const values = [
      data.value || 0,
      data.training_level || 'none',
      data.extra || 0,
      data.notes || null,
      (data.has_encumbrance_penalty ? (data.encumbrance_penalty || 0) : null),
      id
    ];
    db.query(sql, values, callback);
  }

};

module.exports = FeatureModel;