const db = require('../config/database');

const ItemsModel = {
  search: (q, callback) => {
    const sql = `SELECT * FROM items_catalog WHERE name LIKE ? OR description LIKE ? LIMIT 50`;
    const like = `%${q}%`;
    db.query(sql, [like, like], (err, results) => {
      if (err) return callback(err);
      const parsed = (results || []).map(r => {
        let meta = null;
        if (r && r.metadata !== undefined && r.metadata !== null) {
          if (typeof r.metadata === 'object') meta = r.metadata;
          else if (typeof r.metadata === 'string') {
            try { meta = JSON.parse(r.metadata); } catch (e) { meta = r.metadata; }
          }
        }
        return { ...r, metadata: meta };
      });
      callback(null, parsed);
    });
  },

  findById: (id, callback) => {
    const sql = `SELECT * FROM items_catalog WHERE id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      const r = results && results[0] ? results[0] : null;
      if (r && r.metadata !== undefined && r.metadata !== null) {
        if (typeof r.metadata === 'object') {
          // keep
        } else if (typeof r.metadata === 'string') {
          try { r.metadata = JSON.parse(r.metadata); } catch (e) { /* keep string */ }
        }
      }
      callback(null, r);
    });
  }
  ,
  create: (data, callback) => {
    const sql = `INSERT INTO items_catalog (name, description, space, category, metadata) VALUES (?, ?, ?, ?, ?)`;
    let metadataValue = null;
    if (data && data.metadata !== undefined && data.metadata !== null) {
      if (typeof data.metadata === 'string') {
        try { JSON.parse(data.metadata); metadataValue = data.metadata; } catch (e) { metadataValue = null; }
      } else if (typeof data.metadata === 'object') {
        metadataValue = JSON.stringify(data.metadata);
      }
    }
    const vals = [data.name, data.description || null, data.space || 0, data.category || null, metadataValue];
    db.query(sql, vals, callback);
  },
  update: (id, data, callback) => {
    const sql = `UPDATE items_catalog SET name = ?, description = ?, space = ?, category = ?, metadata = ? WHERE id = ?`;
    let metadataValue = null;
    if (data && data.metadata !== undefined && data.metadata !== null) {
      if (typeof data.metadata === 'string') {
        try { JSON.parse(data.metadata); metadataValue = data.metadata; } catch (e) { metadataValue = null; }
      } else if (typeof data.metadata === 'object') {
        metadataValue = JSON.stringify(data.metadata);
      }
    }
    const vals = [data.name, data.description || null, data.space || 0, data.category || null, metadataValue, id];
    db.query(sql, vals, callback);
  },
  remove: (id, callback) => {
    db.query('DELETE FROM items_catalog WHERE id = ?', [id], callback);
  }
};

module.exports = ItemsModel;
