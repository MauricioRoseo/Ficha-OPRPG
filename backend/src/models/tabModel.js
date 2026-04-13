const db = require('../config/database');

const TabModel = {
  // return tabs for a character ordered by position
  getByCharacter: (characterId, callback) => {
    const sql = `SELECT * FROM character_tabs WHERE character_id = ? ORDER BY position ASC`;
    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);
      callback(null, results || []);
    });
  },

  // insert default tabs for a character
  createDefaultTabsForCharacter: (characterId, callback) => {
    const defaults = [
      { tab_key: 'ficha', title: 'Ficha', position: 1 },
      { tab_key: 'antecedente', title: 'Antecedente', position: 2 },
      { tab_key: 'notas', title: 'Notas', position: 3 }
    ];

    const values = defaults.map(d => [characterId, d.tab_key, d.title, d.position, 1]);
    const sql = `INSERT INTO character_tabs (character_id, tab_key, title, position, visible) VALUES ?`;
    db.query(sql, [values], (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  }

};

module.exports = TabModel;
