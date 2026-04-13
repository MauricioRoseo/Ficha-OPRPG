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
