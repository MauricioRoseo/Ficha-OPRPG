require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// 🔥 helper pra executar query com promise
const query = (sql, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const seed = async () => {
  try {
    console.log('🌱 Iniciando seed de teste expandida...');

    // helper para criar usuário
    const createUser = async (name, email, plainPassword = '1234') => {
      // check existing
      const existing = await query(`SELECT id FROM users WHERE email = ?`, [email]);
      if (existing && existing.length > 0) {
        console.log('ℹ Usuário já existe:', email, existing[0].id);
        return existing[0].id;
      }

      const hashed = await bcrypt.hash(plainPassword, 10);
      const res = await query(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashed]);
      console.log('✔ Usuário criado:', name, res.insertId);
      return res.insertId;
    };

    // helper para criar personagem com atributos básicos
    const createCharacter = async (userId, charData) => {
      const values = [
        userId,
        charData.name,
        charData.classe || null,
        charData.trilha || null,
        charData.origem || null,
        charData.nex || 0,
        charData.nivel || 0,
        charData.vida_atual || 0,
        charData.vida_max || 0,
        charData.sanidade_atual || 0,
        charData.sanidade_max || 0,
        charData.esforco_atual || 0,
        charData.esforco_max || 0,
        charData.prestigio || 0,
        charData.morrendo || 0,
        charData.enlouquecendo || 0,
        charData.deslocamento_atual || 0,
        charData.deslocamento_max || 0,
        charData.imagem_perfil || null,
        charData.imagem_token || null,
        charData.idade || null
      ];

      const sql = `INSERT INTO characters (
        user_id, name, classe, trilha, origem, nex, nivel,
        vida_atual, vida_max, sanidade_atual, sanidade_max,
        esforco_atual, esforco_max, prestigio, morrendo, enlouquecendo,
        deslocamento_atual, deslocamento_max, imagem_perfil, imagem_token, idade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const res = await query(sql, values);
      console.log(`✔ Personagem criado: ${charData.name} (id=${res.insertId})`);
      return res.insertId;
    };

    // criar vários usuários
    const u1 = await createUser('Teste', 'teste@email.com');
    const u2 = await createUser('Alice Silva', 'alice@example.com');
    const u3 = await createUser('Carlos Ramos', 'carlos@example.com');
    const u4 = await createUser('Mariana Costa', 'mariana@example.com');

    // criar personagens para cada usuário
    const c1 = await createCharacter(u1, {
      name: 'Agente Teste', classe: 'Combatente', nex: 20, nivel: 4,
      vida_atual: 15, vida_max: 20, sanidade_atual: 12, sanidade_max: 16,
      esforco_atual: 3, esforco_max: 5, idade: 32, origem: 'Distrito 7', prestigio: 10,
      imagem_perfil: null, imagem_token: null
    });

    const c2 = await createCharacter(u2, {
      name: 'Operativa Violeta', classe: 'Infiltrador', trilha: 'Sombra', nex: 35, nivel: 7,
      vida_atual: 18, vida_max: 22, sanidade_atual: 14, sanidade_max: 16,
      esforco_atual: 4, esforco_max: 6, idade: 28, origem: 'Colônia Leste', prestigio: 45,
      imagem_perfil: 'https://placekitten.com/420/420', imagem_token: null
    });

    const c3 = await createCharacter(u3, {
      name: 'Dr. Ramos', classe: 'Especialista', trilha: 'Cientista', nex: 50, nivel: 10,
      vida_atual: 12, vida_max: 14, sanidade_atual: 10, sanidade_max: 14,
      esforco_atual: 2, esforco_max: 4, idade: 45, origem: 'Centro de Pesquisa', prestigio: 120,
      imagem_perfil: null, imagem_token: 'https://placekitten.com/300/450'
    });

    const c4 = await createCharacter(u4, {
      name: 'Mariana Costa', classe: 'Healer', trilha: 'Clérigo', nex: 60, nivel: 12,
      vida_atual: 16, vida_max: 18, sanidade_atual: 16, sanidade_max: 18,
      esforco_atual: 5, esforco_max: 7, idade: 34, origem: 'Templo Norte', prestigio: 210,
      imagem_perfil: 'https://placekitten.com/410/410', imagem_token: 'https://placekitten.com/250/375'
    });

    // criar atributos para cada personagem
    await query(`INSERT INTO attributes (character_id, forca, agilidade, intelecto, vigor, presenca) VALUES (?, ?, ?, ?, ?, ?)`, [c1, 3, 2, 1, 2, 1]);
    await query(`INSERT INTO attributes (character_id, forca, agilidade, intelecto, vigor, presenca) VALUES (?, ?, ?, ?, ?, ?)`, [c2, 2, 4, 3, 3, 2]);
    await query(`INSERT INTO attributes (character_id, forca, agilidade, intelecto, vigor, presenca) VALUES (?, ?, ?, ?, ?, ?)`, [c3, 1, 2, 5, 1, 2]);
    await query(`INSERT INTO attributes (character_id, forca, agilidade, intelecto, vigor, presenca) VALUES (?, ?, ?, ?, ?, ?)`, [c4, 2, 2, 3, 3, 4]);

    // criar guias padrão para cada personagem (ficha, antecedente, notas)
    const createTabs = async (charId) => {
      const exists = await query(`SELECT id FROM character_tabs WHERE character_id = ?`, [charId]);
      if (exists && exists.length > 0) return;
      await query(`INSERT INTO character_tabs (character_id, tab_key, title, position, visible) VALUES (?, ?, ?, ?, ?)`, [charId, 'ficha', 'Ficha', 1, 1]);
      await query(`INSERT INTO character_tabs (character_id, tab_key, title, position, visible) VALUES (?, ?, ?, ?, ?)`, [charId, 'antecedente', 'Antecedente', 2, 1]);
      await query(`INSERT INTO character_tabs (character_id, tab_key, title, position, visible) VALUES (?, ?, ?, ?, ?)`, [charId, 'notas', 'Notas', 3, 1]);
    };

    await createTabs(c1);
    await createTabs(c2);
    await createTabs(c3);
    await createTabs(c4);

    console.log('✔ Atributos criados para personagens de exemplo');

    // buscar features base
    const features = await query(`SELECT * FROM features`);

    const find = (name) => features.find(f => f.name === name);

    // vincular features variadas a cada personagem
    const luta = find('Luta');
    const furtividade = find('Furtividade');
    const percepcao = find('Percepção');
    const investigacao = find('Investigação');
    const persuasao = find('Persuasão');
    const cicatriz = find('Cicatrização');
    const protecao = find('Proteção');
    const purificacao = find('Purificação');
    const acalentar = find('Acalentar');
    const curaRapida = find('Cura Rápida');
    const conhecimento = find('Conhecimento Arcano');
    const aprimorar = find('Aprimorar Arma');

    const addFeature = async (charId, feat, opts = {}) => {
      if (!feat) return;
      // avoid duplicate link
      const exists = await query(`SELECT id FROM character_features WHERE character_id = ? AND feature_id = ?`, [charId, feat.id]);
      if (exists && exists.length > 0) {
        console.log(`ℹ Feature ${feat.name} já vinculada a char ${charId}`);
        return;
      }

      // fetch canonical feature to snapshot metadata
      const featureRow = await query(`SELECT * FROM features WHERE id = ?`, [feat.id]);
      const fr = featureRow && featureRow.length > 0 ? featureRow[0] : null;

      const sql = `INSERT INTO character_features (character_id, feature_id, value, training_level, extra, notes, template_id, template_name, template_description, template_metadata, encumbrance_penalty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const vals = [
        charId,
        feat.id,
        opts.value || 1,
        opts.training_level || 'none',
        opts.extra || null,
        opts.notes || null,
        fr ? fr.id : null,
        fr ? fr.name : null,
        fr ? fr.description : null,
        fr ? JSON.stringify(fr.metadata || {}) : null,
        // encumbrance_penalty: if feature supports penalty, default to its value or 0, otherwise null
        fr && fr.has_encumbrance_penalty ? (fr.encumbrance_penalty !== null ? fr.encumbrance_penalty : 0) : null
      ];

      await query(sql, vals);
      console.log(`✔ Feature ${feat.name} vinculada a char ${charId}`);
    };

    // Agente Teste (c1)
    await addFeature(c1, luta, { value: 3, training_level: 'veteran', extra: 2 });
    await addFeature(c1, percepcao, { value: 2, training_level: 'trained' });
  await addFeature(c1, acalentar, { value: 1, training_level: 'none' });

    // Operativa Violeta (c2)
    await addFeature(c2, furtividade, { value: 4, training_level: 'veteran' });
    await addFeature(c2, investigacao, { value: 3, training_level: 'trained' });
    await addFeature(c2, persuasao, { value: 2, training_level: 'trained' });

    // Dr. Ramos (c3)
    await addFeature(c3, conhecimento, { value: 5, training_level: 'veteran' });
    await addFeature(c3, purificacao, { value: 2, training_level: 'trained' });
    await addFeature(c3, aprimorar, { value: 2, training_level: 'trained' });

    // Mariana (c4)
    await addFeature(c4, curaRapida, { value: 4, training_level: 'veteran' });
    await addFeature(c4, cicatriz, { value: 3, training_level: 'trained' });
    await addFeature(c4, percepcao, { value: 2, training_level: 'trained' });

    // mais personagens (exemplos rápido)
    const c5 = await createCharacter(u2, { name: 'Sombras', classe: 'Scout', nex: 30, nivel: 6, idade: 26, origem: 'Distrito 3', imagem_perfil: null });
    await query(`INSERT INTO attributes (character_id, forca, agilidade, intelecto, vigor, presenca) VALUES (?, ?, ?, ?, ?, ?)`, [c5, 2, 4, 2, 2, 1]);
    await addFeature(c5, furtividade, { value: 3, training_level: 'trained' });

    const c6 = await createCharacter(u3, { name: 'Engenheiro K', classe: 'Technician', nex: 40, nivel: 8, idade: 38, origem: 'Oficina Central' });
    await query(`INSERT INTO attributes (character_id, forca, agilidade, intelecto, vigor, presenca) VALUES (?, ?, ?, ?, ?, ?)`, [c6, 2, 2, 4, 2, 1]);
    await addFeature(c6, conhecimento, { value: 3, training_level: 'trained' });

    // create tabs for additional characters
    await createTabs(c5);
    await createTabs(c6);

    // criar alguns itens de preset no catálogo (se ainda não existirem)
    const createCatalogItem = async (name, description, space, category) => {
      const exists = await query(`SELECT id FROM items_catalog WHERE name = ?`, [name]);
      if (exists && exists.length > 0) return;
      await query(`INSERT INTO items_catalog (name, description, space, category) VALUES (?, ?, ?, ?)`, [name, description, space, category]);
      console.log('✔ Item de catálogo criado:', name);
    };

    await createCatalogItem('Mochila tática', 'Mochila resistente com vários compartimentos.', 5, 'II');
    await createCatalogItem('Kit de primeiros socorros', 'Materiais básicos para curar ferimentos leves.', 2, 'I');
    await createCatalogItem('Lanterna LED', 'Lanterna de mão com baterias recarregáveis.', 1, 'I');
    await createCatalogItem('Rádio portátil', 'Rádio para comunicação em curtas distâncias.', 1, 'I');
    await createCatalogItem('Pistola curta', 'Arma pequena de fogo, geralmente 9mm.', 4, 'III');
    await createCatalogItem('Colete balístico leve', 'Proteção corporal contra impacto reduzido.', 6, 'III');

    // criar alguns rituais de preset no catálogo (se ainda não existirem)
    // ensure rituals_catalog has new columns (if DB wasn't migrated)
    const ensureColumn = async (table, column, definition) => {
      const exists = await query(`SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, column]);
      if (exists && exists[0] && exists[0].c === 0) {
        await query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
        console.log(`✔ Coluna ${column} adicionada em ${table}`);
      }
    };

    // ensure catalog columns
    try {
      await ensureColumn('rituals_catalog', 'execution', 'execution VARCHAR(150)');
      await ensureColumn('rituals_catalog', 'alcance', "alcance VARCHAR(150)");
      await ensureColumn('rituals_catalog', 'duration', "duration VARCHAR(150)");
      await ensureColumn('rituals_catalog', 'resistencia_pericia_id', 'resistencia_pericia_id INT DEFAULT NULL');
      await ensureColumn('rituals_catalog', 'aprimoramento_discente', 'aprimoramento_discente TINYINT DEFAULT 0');
      await ensureColumn('rituals_catalog', 'custo_aprimoramento_discente', 'custo_aprimoramento_discente INT DEFAULT NULL');
      await ensureColumn('rituals_catalog', 'descricao_aprimoramento_discente', 'descricao_aprimoramento_discente TEXT DEFAULT NULL');
      await ensureColumn('rituals_catalog', 'aprimoramento_verdadeiro', 'aprimoramento_verdadeiro TINYINT DEFAULT 0');
      await ensureColumn('rituals_catalog', 'custo_aprimoramento_verdadeiro', 'custo_aprimoramento_verdadeiro INT DEFAULT NULL');
      await ensureColumn('rituals_catalog', 'descricao_aprimoramento_verdadeiro', 'descricao_aprimoramento_verdadeiro TEXT DEFAULT NULL');
      await ensureColumn('rituals_catalog', 'symbol_image_secondary', 'symbol_image_secondary TEXT');
    } catch (e) { console.warn('Erro garantindo colunas do catálogo:', e.message || e); }

    const createCatalogRitual = async (name, circle, element, description, effect, execution, alcance, duration, resistencia_pericia_id, aprimoramento_discente, custo_discente, descricao_discente, aprimoramento_verdadeiro, custo_verdadeiro, descricao_verdadeiro, symbol, symbol2) => {
      const exists = await query(`SELECT id FROM rituals_catalog WHERE name = ?`, [name]);
      if (exists && exists.length > 0) return exists[0].id;
      const res = await query(`INSERT INTO rituals_catalog (name, circle, element, description, effect, execution, alcance, duration, resistencia_pericia_id, aprimoramento_discente, custo_aprimoramento_discente, descricao_aprimoramento_discente, aprimoramento_verdadeiro, custo_aprimoramento_verdadeiro, descricao_aprimoramento_verdadeiro, symbol_image, symbol_image_secondary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [name, circle, element, description, effect, execution, alcance, duration, resistencia_pericia_id || null, aprimoramento_discente ? 1 : 0, custo_discente || null, descricao_discente || null, aprimoramento_verdadeiro ? 1 : 0, custo_verdadeiro || null, descricao_verdadeiro || null, symbol || null, symbol2 || null]);
      console.log('✔ Ritual de catálogo criado:', name);
      return res.insertId;
    };

    const addCharacterRitualFromCatalog = async (charId, ritualCatalogId, dt_resistencia, circulo, limite_rituais) => {
      // ensure character_rituals has snapshot descricao columns
      try {
        const exists1 = await query(`SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'character_rituals' AND COLUMN_NAME = 'snapshot_descricao_aprimoramento_discente'`);
        if (exists1 && exists1[0] && exists1[0].c === 0) await query(`ALTER TABLE character_rituals ADD COLUMN snapshot_descricao_aprimoramento_discente TEXT DEFAULT NULL`);
        const exists2 = await query(`SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'character_rituals' AND COLUMN_NAME = 'snapshot_descricao_aprimoramento_verdadeiro'`);
        if (exists2 && exists2[0] && exists2[0].c === 0) await query(`ALTER TABLE character_rituals ADD COLUMN snapshot_descricao_aprimoramento_verdadeiro TEXT DEFAULT NULL`);
        const exists3 = await query(`SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'character_rituals' AND COLUMN_NAME = 'snapshot_resistencia_pericia_id'`);
        if (exists3 && exists3[0] && exists3[0].c === 0) await query(`ALTER TABLE character_rituals ADD COLUMN snapshot_resistencia_pericia_id INT DEFAULT NULL`);
        const exists4 = await query(`SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'character_rituals' AND COLUMN_NAME = 'snapshot_resistencia_pericia_name'`);
        if (exists4 && exists4[0] && exists4[0].c === 0) await query(`ALTER TABLE character_rituals ADD COLUMN snapshot_resistencia_pericia_name VARCHAR(150) DEFAULT NULL`);
      } catch (e) { /* ignore */ }

      const catalog = await query(`SELECT * FROM rituals_catalog WHERE id = ?`, [ritualCatalogId]);
      if (!catalog || catalog.length === 0) return;
      const c = catalog[0];
      await query(`INSERT INTO character_rituals (character_id, ritual_catalog_id, dt_resistencia, circulo, limite_rituais, snapshot_name, snapshot_element, snapshot_description, snapshot_execution, snapshot_alcance, snapshot_duration, snapshot_resistencia_pericia_id, snapshot_resistencia_pericia_name, snapshot_aprimoramento_discente, snapshot_custo_aprimoramento_discente, snapshot_descricao_aprimoramento_discente, snapshot_aprimoramento_verdadeiro, snapshot_custo_aprimoramento_verdadeiro, snapshot_descricao_aprimoramento_verdadeiro, snapshot_symbol, snapshot_symbol_secondary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [charId, ritualCatalogId, dt_resistencia, circulo, limite_rituais, c.name, c.element, c.description, c.execution, c.alcance, c.duration, c.resistencia_pericia_id || null, null, c.aprimoramento_discente, c.custo_aprimoramento_discente, c.descricao_aprimoramento_discente, c.aprimoramento_verdadeiro, c.custo_aprimoramento_verdadeiro, c.descricao_aprimoramento_verdadeiro, c.symbol_image, c.symbol_image_secondary]);
      console.log(`✔ Ritual ${c.name} vinculado ao personagem ${charId}`);
    };

    // criar rituais de catálogo
    const r1 = await createCatalogRitual('Chama Purificadora', 1, 'Fogo', 'Chama que remove corrupção e cura feridas superficiais.', 'Dano de fogo menor e purificação', 'Invocação breve', 'Alvo', 'Curto (1 rodada)', null, 0, null, null, 0, null, null, null, null);
    const r2 = await createCatalogRitual('Escudo Etéreo', 2, 'Força', 'Cria um escudo protetor que reduz dano recebido.', 'Redução de dano temporária', 'Gestual', 'Área', '2 rodadas', null, 0, null, null, 0, null, null, null, null);
    const r3 = await createCatalogRitual('Visão Além', 1, 'Ar', 'Permite ao conjurador ver através de ilusões e até pequenas distâncias astral.', 'Aumenta percepção por tempo curto', 'Concentração', 'Alvo', '3 rodadas', null, 0, null, null, 0, null, null, null, null);
    const r4 = await createCatalogRitual('Corrente de Entendimento', 3, 'Conhecimento', 'Liga mentes para compartilhamento de conhecimento instantâneo.', 'Compartilha informações entre aliados', 'Cerimonial', 'Área', '1 rodada', null, 0, null, null, 0, null, null, null, null);

    // vincular rituais a personagens de exemplo (usando presença e intelecto dos personagens criados earlier)
    await addCharacterRitualFromCatalog(c1, r1, 10 + 1, 1, 1); // presenca 1, intelecto 1
    await addCharacterRitualFromCatalog(c2, r2, 10 + 2, 2, 3);
    await addCharacterRitualFromCatalog(c3, r4, 10 + 2, 3, 5);
    await addCharacterRitualFromCatalog(c4, r3, 10 + 4, 1, 3);


    console.log('✅ Seed de teste expandida finalizada');
    process.exit();

  } catch (err) {
    console.error('Erro no seed expandida:', err);
    process.exit(1);
  }
};

seed();