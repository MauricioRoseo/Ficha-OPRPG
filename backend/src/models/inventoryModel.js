const db = require('../config/database');

const InventoryModel = {
  create: (data, callback) => {
    const sql = `
      INSERT INTO inventory (character_id, name, description, space, category, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    let metadataValue = null;
    if (data && data.metadata !== undefined && data.metadata !== null) {
      if (typeof data.metadata === 'string') {
        // accept JSON string if valid
        try { JSON.parse(data.metadata); metadataValue = data.metadata; } catch (e) { metadataValue = null; }
      } else if (typeof data.metadata === 'object') {
        metadataValue = JSON.stringify(data.metadata);
      }
    }
    const values = [data.character_id, data.name, data.description || null, data.space || 0, data.category || null, metadataValue];
    db.query(sql, values, callback);
  },

  findByCharacterId: (characterId, callback) => {
    const sql = `SELECT * FROM inventory WHERE character_id = ? ORDER BY id ASC`;
    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);
      // parse metadata JSON if present; handle driver returning objects or strings
      const parsed = (results || []).map(r => {
        let meta = null;
        if (r && r.metadata !== undefined && r.metadata !== null) {
          if (typeof r.metadata === 'object') meta = r.metadata;
          else if (typeof r.metadata === 'string') {
            try { meta = JSON.parse(r.metadata); } catch (e) { meta = null; }
          }
        }
        return { ...r, metadata: meta };
      });
      callback(null, parsed);
    });
  },

  findById: (id, callback) => {
    const sql = `SELECT * FROM inventory WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      const r = (results && results[0]) || null;
      if (r && r.metadata !== undefined && r.metadata !== null) {
        if (typeof r.metadata === 'object') {
          // already parsed by driver
        } else if (typeof r.metadata === 'string') {
          try { r.metadata = JSON.parse(r.metadata); } catch (e) { r.metadata = null; }
        } else {
          r.metadata = null;
        }
      }
      callback(null, r);
    });
  },

  update: (id, data, callback) => {
    const sql = `
      UPDATE inventory SET name = ?, description = ?, space = ?, category = ?, metadata = ? WHERE id = ?
    `;
    let metadataValue = null;
    if (data && data.metadata !== undefined && data.metadata !== null) {
      if (typeof data.metadata === 'string') {
        try { JSON.parse(data.metadata); metadataValue = data.metadata; } catch (e) { metadataValue = null; }
      } else if (typeof data.metadata === 'object') {
        metadataValue = JSON.stringify(data.metadata);
      }
    }
    const values = [data.name, data.description || null, data.space || 0, data.category || null, metadataValue, id];
    db.query(sql, values, callback);
  },

  deleteById: (id, callback) => {
    const sql = `DELETE FROM inventory WHERE id = ?`;
    db.query(sql, [id], callback);
  }
};

module.exports = InventoryModel;
