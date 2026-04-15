const db = require('../config/database');

const ResistanceModel = {
  findByCharacterId: (characterId, callback) => {
    const sql = `SELECT * FROM resistances WHERE character_id = ? LIMIT 1`;
    db.query(sql, [characterId], (err, results) => {
      if (err) return callback(err);
      callback(null, results && results.length ? results[0] : null);
    });
  }
};

// Increment/decrement physical resistance fields by delta (can be negative).
ResistanceModel.incrementPhysical = (characterId, delta, callback) => {
  if (!delta || Number(delta) === 0) return callback(null, { affectedRows: 0 });
  const sql = `UPDATE resistances SET
    acid = GREATEST(0, acid + ?),
    balistico = GREATEST(0, balistico + ?),
    corte = GREATEST(0, corte + ?),
    eletricidade = GREATEST(0, eletricidade + ?),
    fogo = GREATEST(0, fogo + ?),
    frio = GREATEST(0, frio + ?),
    impacto = GREATEST(0, impacto + ?),
    perfuracao = GREATEST(0, perfuracao + ?),
    veneno = GREATEST(0, veneno + ?)
    WHERE character_id = ?`;

  const params = [delta, delta, delta, delta, delta, delta, delta, delta, delta, characterId];
  db.query(sql, params, callback);
};

module.exports = ResistanceModel;

// update full resistances row for a character (replace values)
ResistanceModel.updateByCharacterId = (characterId, data, callback) => {
  const sql = `UPDATE resistances SET
    acid = ?,
    balistico = ?,
    corte = ?,
    eletricidade = ?,
    fogo = ?,
    frio = ?,
    impacto = ?,
    mental = ?,
    perfuracao = ?,
    veneno = ?,
    conhecimento = ?,
    energia = ?,
    sangue = ?,
    morte = ?
    WHERE character_id = ?`;

  const values = [
    Number(data.acid || 0),
    Number(data.balistico || 0),
    Number(data.corte || 0),
    Number(data.eletricidade || 0),
    Number(data.fogo || 0),
    Number(data.frio || 0),
    Number(data.impacto || 0),
    Number(data.mental || 0),
    Number(data.perfuracao || 0),
    Number(data.veneno || 0),
    Number(data.conhecimento || 0),
    Number(data.energia || 0),
    Number(data.sangue || 0),
    Number(data.morte || 0),
    characterId
  ];

  db.query(sql, values, (err, result) => {
    if (err) return callback(err);
    // return updated row
    ResistanceModel.findByCharacterId(characterId, callback);
  });
};
