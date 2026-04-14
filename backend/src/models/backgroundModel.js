const db = require('../config/database');

const BackgroundModel = {
  findByCharacterId: (characterId, callback) => {
    const sql = `SELECT * FROM character_backgrounds WHERE character_id = ? LIMIT 1`;
    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  },

  create: (characterId, payload, callback) => {
    const sql = `INSERT INTO character_backgrounds (character_id, historico, aparencia, personalidade, prato_favorito, pessoas_importantes, pertences_queridos, contatos, traumas, doencas, manias, objetivo, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      characterId,
      payload.historico || null,
      payload.aparencia || null,
      payload.personalidade || null,
      payload.prato_favorito || null,
      payload.pessoas_importantes || null,
      payload.pertences_queridos || null,
      payload.contatos || null,
      payload.traumas || null,
      payload.doencas || null,
      payload.manias || null,
      payload.objetivo || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
    ];
    db.query(sql, values, callback);
  },

  update: (characterId, payload, callback) => {
    const sql = `UPDATE character_backgrounds SET historico = ?, aparencia = ?, personalidade = ?, prato_favorito = ?, pessoas_importantes = ?, pertences_queridos = ?, contatos = ?, traumas = ?, doencas = ?, manias = ?, objetivo = ?, metadata = ? WHERE character_id = ?`;
    const values = [
      payload.historico || null,
      payload.aparencia || null,
      payload.personalidade || null,
      payload.prato_favorito || null,
      payload.pessoas_importantes || null,
      payload.pertences_queridos || null,
      payload.contatos || null,
      payload.traumas || null,
      payload.doencas || null,
      payload.manias || null,
      payload.objetivo || null,
      payload.metadata ? JSON.stringify(payload.metadata) : null,
      characterId,
    ];

    db.query(sql, values, (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  }
};

module.exports = BackgroundModel;
