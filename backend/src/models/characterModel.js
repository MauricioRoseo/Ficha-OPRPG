const db = require('../config/database');

const CharacterModel = {
  create: (data, callback) => {
    const sql = `
      INSERT INTO characters (
        user_id, name, idade, classe, trilha, origem, nex, nivel,

        vida_atual, vida_max, vida_temp,
        sanidade_atual, sanidade_max,
        esforco_atual, esforco_max, esforco_temp,

        defesa_passiva, esquiva, bloqueio,

        prestigio,
        morrendo, enlouquecendo,

        deslocamento_atual, deslocamento_max,

        imagem_perfil, imagem_token
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.user_id,
      data.name,
      data.idade,
      data.classe,
      data.trilha,
      data.origem,
      data.nex,
      data.nivel,

      data.vida_atual || 0,
      data.vida_max || 0,
      data.vida_temp || 0,

      data.sanidade_atual || 0,
      data.sanidade_max || 0,

      data.esforco_atual || 0,
      data.esforco_max || 0,
      data.esforco_temp || 0,

      data.defesa_passiva || 0,
      data.esquiva || 0,
      data.bloqueio || 0,

      data.prestigio || 0,
        data.patente || null,

      data.morrendo || 0,
      data.enlouquecendo || 0,

      data.deslocamento_atual || 0,
      data.deslocamento_max || 0,

      data.imagem_perfil || null,
      data.imagem_token || null
    ];

    db.query(sql, values, callback);
  },

  findAll: (callback) => {
    db.query('SELECT * FROM characters', callback);
  },

  findByUserId: (userId, callback) => {
  const sql = `SELECT * FROM characters WHERE user_id = ?`;
  db.query(sql, [userId], callback);
  },

  findById: (id, callback) => {
  const sql = `SELECT * FROM characters WHERE id = ?`;
  db.query(sql, [id], (err, results) => {
    if (err) return callback(err);

    callback(null, results[0]);
  });
}
};

// atualiza campos de status (vida, esforço, sanidade)
// NOTE: only include `patrimonio` in the UPDATE when it's explicitly provided in `data`.
// This avoids overwriting an existing patrimonio with NULL when callers don't send that field.
CharacterModel.update = (id, data, callback) => {
  // base columns always updated
  const baseSet = [
    'vida_atual = ?',
    'vida_temp = ?',
    'esforco_atual = ?',
    'esforco_temp = ?',
    'sanidade_atual = ?',
    'defesa_passiva = ?',
    'esquiva = ?',
    'bloqueio = ?',
    'morrendo = ?',
    'enlouquecendo = ?'
  ];

  const values = [
    (data.vida_atual !== undefined ? data.vida_atual : 0),
    (data.vida_temp !== undefined ? data.vida_temp : 0),
    (data.esforco_atual !== undefined ? data.esforco_atual : 0),
    (data.esforco_temp !== undefined ? data.esforco_temp : 0),
    (data.sanidade_atual !== undefined ? data.sanidade_atual : 0),
    (data.defesa_passiva !== undefined ? data.defesa_passiva : 0),
    (data.esquiva !== undefined ? data.esquiva : 0),
    (data.bloqueio !== undefined ? data.bloqueio : 0),
    (data.morrendo !== undefined ? data.morrendo : 0),
    (data.enlouquecendo !== undefined ? data.enlouquecendo : 0)
  ];

  let sql = `UPDATE characters SET ${baseSet.join(', ')} `;

  // Only include patrimonio when provided (could be null intentionally)
  if (Object.prototype.hasOwnProperty.call(data, 'patrimonio')) {
    sql += `, patrimonio = ? `;
    values.push(data.patrimonio);
  }

  sql += `WHERE id = ?`;
  values.push(id);

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('[DEBUG] CharacterModel.update SQL error', err, { sql: sql.trim(), values });
    } else {
      // find index of patrimonio value in values if present
      let patrimonioVal = '<unchanged>';
      if (Object.prototype.hasOwnProperty.call(data, 'patrimonio')) {
        patrimonioVal = data.patrimonio;
      }
      try { console.log('[DEBUG] CharacterModel.update success', { id, patrimonio: patrimonioVal }); } catch(e){}
    }
    callback(err, result);
  });
};
// add debug wrapper to update to log SQL and values
const originalUpdate = CharacterModel.update;
CharacterModel.update = (id, data, callback) => {
  // This branch shouldn't be used because we defined update earlier as function, keep for safety
  return originalUpdate(id, data, callback);
};

// update max stats and defenses for a character
CharacterModel.updateMaxAndDefenses = (id, vidaMax, esforcoMax, sanidadeMax, defesaPassiva, esquivaVal, bloqueioVal, callback) => {
  const sql = `UPDATE characters SET vida_max = ?, esforco_max = ?, sanidade_max = ?, defesa_passiva = ?, esquiva = ?, bloqueio = ? WHERE id = ?`;
  db.query(sql, [vidaMax || 0, esforcoMax || 0, sanidadeMax || 0, defesaPassiva || 0, esquivaVal || 0, bloqueioVal || 0, id], callback);
};

// update proficiencies text field
CharacterModel.updateProficiencies = (id, proficiencies, prestigio, patente, callback) => {
  const sql = `UPDATE characters SET proficiencias = ?, prestigio = ?, patente = ? WHERE id = ?`;
  db.query(sql, [proficiencies || null, prestigio || 0, patente || null, id], callback);
};

module.exports = CharacterModel;

// set only passive defense value for a character
CharacterModel.setPassiveDefense = (id, value, callback) => {
  const sql = `UPDATE characters SET defesa_passiva = ? WHERE id = ?`;
  db.query(sql, [value || 0, id], callback);
};

// set current and max carga for a character
CharacterModel.setCarga = (id, cargaAtual, cargaMaxima, callback) => {
  const sql = `UPDATE characters SET carga_atual = ?, carga_maxima = ? WHERE id = ?`;
  db.query(sql, [cargaAtual || 0, cargaMaxima || 0, id], callback);
};

// update computed max stats for a character
CharacterModel.updateMaxStats = (id, vidaMax, esforcoMax, sanidadeMax, callback) => {
  const sql = `UPDATE characters SET vida_max = ?, esforco_max = ?, sanidade_max = ? WHERE id = ?`;
  db.query(sql, [vidaMax || 0, esforcoMax || 0, sanidadeMax || 0, id], callback);
};

// update basic character details (profile/configuration fields)
CharacterModel.updateDetails = (id, data, callback) => {
  // Note: patente should not be directly editable here (computed from prestigio).
  // We update both the human-readable text fields and the *_id foreign keys (if provided)
  const sql = `
    UPDATE characters SET
      name = ?,
      idade = ?,
      origem = ?,
      origem_id = ?,
      classe = ?,
      classe_id = ?,
      trilha = ?,
      trilha_id = ?,
      nivel = ?,
      nex = ?,
      prestigio = ?,
      afinidade = ?,
      imagem_perfil = ?,
      imagem_token = ?,
        status_formula = ?,
        defense_formula = ?
    WHERE id = ?
  `;

  const values = [
    data.name || null,
    (data.idade !== undefined && data.idade !== null) ? data.idade : null,
    data.origem || null,
    (data.origem_id !== undefined ? data.origem_id : null),
    data.classe || null,
    (data.classe_id !== undefined ? data.classe_id : null),
    data.trilha || null,
    (data.trilha_id !== undefined ? data.trilha_id : null),
    (data.nivel !== undefined && data.nivel !== null) ? data.nivel : null,
    (data.nex !== undefined && data.nex !== null) ? data.nex : null,
    (data.prestigio !== undefined && data.prestigio !== null) ? data.prestigio : null,
    data.afinidade || null,
    data.imagem_perfil || null,
    data.imagem_token || null,
      (data.status_formula !== undefined && data.status_formula !== null) ? JSON.stringify(data.status_formula) : null,
      (data.defense_formula !== undefined && data.defense_formula !== null) ? JSON.stringify(data.defense_formula) : null,
    id
  ];

  db.query(sql, values, callback);
};