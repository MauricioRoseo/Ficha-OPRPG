const db = require('../config/database');

const CharacterRitualModel = {
  // Add ritual to character from catalog (snapshots important fields)
  addFromCatalog: (characterId, ritualId, data, callback) => {
    const sql = `
      INSERT INTO character_rituals
      (character_id, ritual_catalog_id, dt_resistencia, circulo, limite_rituais, granted_by_level, snapshot_name, snapshot_element, snapshot_description, snapshot_execution, snapshot_alcance, snapshot_alvo, snapshot_duration, snapshot_resistencia_pericia_id, snapshot_resistencia_pericia_name, snapshot_aprimoramento_discente, snapshot_custo_aprimoramento_discente, snapshot_descricao_aprimoramento_discente, snapshot_aprimoramento_verdadeiro, snapshot_custo_aprimoramento_verdadeiro, snapshot_descricao_aprimoramento_verdadeiro, snapshot_symbol, snapshot_symbol_secondary, created_at)
      SELECT ?, id, ?, ?, ?, ?, name, element, description, execution, alcance, alvo, duration, resistencia_pericia_id, (SELECT name FROM features WHERE id = rituals_catalog.resistencia_pericia_id LIMIT 1), aprimoramento_discente, custo_aprimoramento_discente, descricao_aprimoramento_discente, aprimoramento_verdadeiro, custo_aprimoramento_verdadeiro, descricao_aprimoramento_verdadeiro, symbol_image, symbol_image_secondary, NOW() FROM rituals_catalog WHERE id = ?
    `;
    const values = [
      characterId,
      data.dt_resistencia || null,
      data.circulo || null,
      data.limite_rituais || null,
      data.granted_by_level ? 1 : 0,
      ritualId
    ];
    console.log('[CharacterRitualModel.addFromCatalog] sql values:', values);
    db.query(sql, values, (err, result) => {
      if (err) console.error('[CharacterRitualModel.addFromCatalog] error:', err && err.message);
      else console.log('[CharacterRitualModel.addFromCatalog] result:', result && (result.insertId || result.affectedRows));
      if (typeof callback === 'function') callback(err, result);
    });
  },

  // Create a custom ritual directly on the character
  createCustom: (characterId, data, callback) => {
    const sql = `
      INSERT INTO character_rituals
      (character_id, ritual_catalog_id, dt_resistencia, circulo, limite_rituais, granted_by_level, snapshot_name, snapshot_element, snapshot_description, snapshot_execution, snapshot_alcance, snapshot_alvo, snapshot_duration, snapshot_resistencia_pericia_id, snapshot_resistencia_pericia_name, snapshot_aprimoramento_discente, snapshot_custo_aprimoramento_discente, snapshot_descricao_aprimoramento_discente, snapshot_aprimoramento_verdadeiro, snapshot_custo_aprimoramento_verdadeiro, snapshot_descricao_aprimoramento_verdadeiro, snapshot_symbol, snapshot_symbol_secondary, created_at)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      characterId,
      data.dt_resistencia || null,
      data.circulo || null,
      data.limite_rituais || null,
      data.granted_by_level ? 1 : 0,
      data.name || null,
      data.element || null,
      data.description || null,
      // 'effect' not stored separately in some schemas; skip to avoid missing column
      data.execution || null,
      data.alcance || null,
      data.alvo || null,
      data.duration || null,
      data.resistencia_pericia_id || null,
      data.resistencia_pericia_name || null,
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

  getByCharacter: (characterId, callback) => {
    const sql = `SELECT * FROM character_rituals WHERE character_id = ? ORDER BY created_at DESC`;
    db.query(sql, [characterId], callback);
  },

  update: (characterId, id, data, callback) => {
    const sql = `UPDATE character_rituals SET
      dt_resistencia = ?,
      circulo = ?,
      snapshot_symbol = ?,
      snapshot_symbol_secondary = ?,
      dt_modifiers = ?,
      snapshot_name = COALESCE(?, snapshot_name),
      snapshot_element = COALESCE(?, snapshot_element),
      snapshot_description = COALESCE(?, snapshot_description),
      snapshot_effect = COALESCE(?, snapshot_effect),
      snapshot_execution = COALESCE(?, snapshot_execution),
      snapshot_alcance = COALESCE(?, snapshot_alcance),
      snapshot_alvo = COALESCE(?, snapshot_alvo),
      snapshot_duration = COALESCE(?, snapshot_duration),
      snapshot_resistencia_pericia_id = COALESCE(?, snapshot_resistencia_pericia_id),
      snapshot_resistencia_pericia_name = COALESCE(?, snapshot_resistencia_pericia_name),
      snapshot_aprimoramento_discente = COALESCE(?, snapshot_aprimoramento_discente),
      snapshot_custo_aprimoramento_discente = COALESCE(?, snapshot_custo_aprimoramento_discente),
      snapshot_descricao_aprimoramento_discente = COALESCE(?, snapshot_descricao_aprimoramento_discente),
      snapshot_aprimoramento_verdadeiro = COALESCE(?, snapshot_aprimoramento_verdadeiro),
      snapshot_custo_aprimoramento_verdadeiro = COALESCE(?, snapshot_custo_aprimoramento_verdadeiro),
      snapshot_descricao_aprimoramento_verdadeiro = COALESCE(?, snapshot_descricao_aprimoramento_verdadeiro)
      WHERE id = ? AND character_id = ?`;
    const values = [
      data.dt_resistencia || null,
      data.circulo || null,
      data.snapshot_symbol || null,
      data.snapshot_symbol_secondary || null,
      data.dt_modifiers ? JSON.stringify(data.dt_modifiers) : null,
      data.snapshot_name || null,
      data.snapshot_element || null,
      data.snapshot_description || null,
      data.snapshot_effect || null,
      data.snapshot_execution || null,
      data.snapshot_alcance || null,
      data.snapshot_alvo || null,
      data.snapshot_duration || null,
      data.snapshot_resistencia_pericia_id || null,
      data.snapshot_resistencia_pericia_name || null,
      data.snapshot_aprimoramento_discente || null,
      data.snapshot_custo_aprimoramento_discente || null,
      data.snapshot_descricao_aprimoramento_discente || null,
      data.snapshot_aprimoramento_verdadeiro || null,
      data.snapshot_custo_aprimoramento_verdadeiro || null,
      data.snapshot_descricao_aprimoramento_verdadeiro || null,
      id,
      characterId
    ];
    db.query(sql, values, callback);
  },

  remove: (id, callback) => {
    db.query('DELETE FROM character_rituals WHERE id = ?', [id], callback);
  }
};

module.exports = CharacterRitualModel;
