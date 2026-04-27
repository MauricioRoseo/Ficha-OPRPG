const db = require('../config/database');

const RitualModel = {
  create: (data, callback) => {
    const sql = `INSERT INTO rituals_catalog (name, circle, element, description, effect, execution, alcance, alvo, duration, resistencia_pericia_id, aprimoramento_discente, custo_aprimoramento_discente, descricao_aprimoramento_discente, aprimoramento_verdadeiro, custo_aprimoramento_verdadeiro, descricao_aprimoramento_verdadeiro, symbol_image, symbol_image_secondary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const values = [
      data.name,
      data.circle || null,
      data.element || null,
      data.description || null,
      data.effect || null,
      data.execution || null,
      data.alcance || null,
      data.alvo || null,
      data.duration || null,
      data.resistencia_pericia_id || null,
      data.aprimoramento_discente ? 1 : 0,
      data.custo_aprimoramento_discente || null,
      data.descricao_aprimoramento_discente || null,
      data.aprimoramento_verdadeiro ? 1 : 0,
      data.custo_aprimoramento_verdadeiro || null,
      data.descricao_aprimoramento_verdadeiro || null,
      data.symbol_image || null,
      data.symbol_image_secondary || null
    ];
    db.query(sql, values, callback);
  },

  findAll: (callback) => {
    db.query('SELECT * FROM rituals_catalog ORDER BY name', callback);
  },

  search: (q, callback) => {
    const sql = `SELECT * FROM rituals_catalog WHERE name LIKE ? OR element LIKE ? ORDER BY name`;
    const like = `%${q}%`;
    db.query(sql, [like, like], (err, results) => {
      if (err) return callback(err);
      callback(null, results.map(r => ({
        ...r,
      })));
    });
  },

  findById: (id, callback) => {
    db.query('SELECT * FROM rituals_catalog WHERE id = ?', [id], (err, results) => {
      if (err) return callback(err);
      if (!results || results.length === 0) return callback(null, null);
      callback(null, results[0]);
    });
  }
  ,
  update: (id, data, callback) => {
    const sql = `UPDATE rituals_catalog SET name = ?, circle = ?, element = ?, description = ?, effect = ?, execution = ?, alcance = ?, alvo = ?, duration = ?, resistencia_pericia_id = ?, aprimoramento_discente = ?, custo_aprimoramento_discente = ?, descricao_aprimoramento_discente = ?, aprimoramento_verdadeiro = ?, custo_aprimoramento_verdadeiro = ?, descricao_aprimoramento_verdadeiro = ?, symbol_image = ?, symbol_image_secondary = ? WHERE id = ?`;
    const values = [
      data.name,
      data.circle || null,
      data.element || null,
      data.description || null,
      data.effect || null,
      data.execution || null,
      data.alcance || null,
      data.alvo || null,
      data.duration || null,
      data.resistencia_pericia_id || null,
      data.aprimoramento_discente ? 1 : 0,
      data.custo_aprimoramento_discente || null,
      data.descricao_aprimoramento_discente || null,
      data.aprimoramento_verdadeiro ? 1 : 0,
      data.custo_aprimoramento_verdadeiro || null,
      data.descricao_aprimoramento_verdadeiro || null,
      data.symbol_image || null,
      data.symbol_image_secondary || null,
      id
    ];
    db.query(sql, values, callback);
  },
  remove: (id, callback) => {
    db.query('DELETE FROM rituals_catalog WHERE id = ?', [id], callback);
  }
};

module.exports = RitualModel;
