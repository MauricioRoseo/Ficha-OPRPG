const db = require('../config/database');

const CharacterRitualModel = {
  // Add ritual to character from catalog (snapshots important fields)
  addFromCatalog: (characterId, ritualId, data, callback) => {
    const sql = `
      INSERT INTO character_rituals
      (character_id, ritual_catalog_id, dt_resistencia, circulo, limite_rituais, snapshot_name, snapshot_element, snapshot_description, snapshot_execution, snapshot_alcance, snapshot_duration, snapshot_resistencia_pericia_id, snapshot_resistencia_pericia_name, snapshot_aprimoramento_discente, snapshot_custo_aprimoramento_discente, snapshot_descricao_aprimoramento_discente, snapshot_aprimoramento_verdadeiro, snapshot_custo_aprimoramento_verdadeiro, snapshot_descricao_aprimoramento_verdadeiro, snapshot_symbol, snapshot_symbol_secondary, created_at)
      SELECT ?, id, ?, ?, ?, name, element, description, execution, alcance, duration, resistencia_pericia_id, (SELECT name FROM features WHERE id = rituals_catalog.resistencia_pericia_id LIMIT 1), aprimoramento_discente, custo_aprimoramento_discente, descricao_aprimoramento_discente, aprimoramento_verdadeiro, custo_aprimoramento_verdadeiro, descricao_aprimoramento_verdadeiro, symbol_image, symbol_image_secondary, NOW() FROM rituals_catalog WHERE id = ?
    `;
    const values = [
      characterId,
      data.dt_resistencia || null,
      data.circulo || null,
      data.limite_rituais || null,
      ritualId
    ];
    db.query(sql, values, callback);
  },

  // Create a custom ritual directly on the character
  createCustom: (characterId, data, callback) => {
    const sql = `
      INSERT INTO character_rituals
      (character_id, ritual_catalog_id, dt_resistencia, circulo, limite_rituais, snapshot_name, snapshot_element, snapshot_description, snapshot_execution, snapshot_alcance, snapshot_duration, snapshot_resistencia_pericia_id, snapshot_resistencia_pericia_name, snapshot_aprimoramento_discente, snapshot_custo_aprimoramento_discente, snapshot_descricao_aprimoramento_discente, snapshot_aprimoramento_verdadeiro, snapshot_custo_aprimoramento_verdadeiro, snapshot_descricao_aprimoramento_verdadeiro, snapshot_symbol, snapshot_symbol_secondary, created_at)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [
      characterId,
      data.dt_resistencia || null,
      data.circulo || null,
      data.limite_rituais || null,
      data.name || null,
      data.element || null,
      data.description || null,
      data.execution || null,
      data.alcance || null,
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
      snapshot_execution = COALESCE(?, snapshot_execution),
      snapshot_alcance = COALESCE(?, snapshot_alcance),
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
      data.snapshot_execution || null,
      data.snapshot_alcance || null,
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
