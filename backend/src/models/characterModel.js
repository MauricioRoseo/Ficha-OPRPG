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
CharacterModel.update = (id, data, callback) => {
  const sql = `
    UPDATE characters SET
      vida_atual = ?,
      vida_temp = ?,
      esforco_atual = ?,
      esforco_temp = ?,
      sanidade_atual = ?,
      defesa_passiva = ?,
      esquiva = ?,
      bloqueio = ?,
      morrendo = ?,
      enlouquecendo = ?,
      patrimonio = ?
    WHERE id = ?
  `;

  const values = [
    data.vida_atual || 0,
    data.vida_temp || 0,
    data.esforco_atual || 0,
    data.esforco_temp || 0,
    data.sanidade_atual || 0,
    data.defesa_passiva || 0,
    data.esquiva || 0,
    data.bloqueio || 0,
    data.morrendo || 0,
    data.enlouquecendo || 0,
    (data.patrimonio !== undefined ? data.patrimonio : null),
    id,
  ];

  db.query(sql, values, callback);
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