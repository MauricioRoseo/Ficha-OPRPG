require('dotenv').config();
const db = require('../config/database');

const features = [

  // 🔥 PERÍCIA
  {
    name: 'Luta',
    type: 'pericia',
    description: 'Combate corpo a corpo.',
    metadata: {
      atributo: 'forca',
      penalidade_carga: false
    }
  },

  // 🔥 RITUAL
  {
    name: 'Cicatrização',
    type: 'ritual',
    description: 'Acelera a cura de ferimentos.',
    metadata: {
      circulo: 1,
      execucao: 'padrão',
      alcance: 'toque',
      alvo: '1 criatura',
      duracao: 'instantânea',
      efeito: 'Recupera 3d8+3 PV'
    }
  },

  // 🔥 HABILIDADE
  {
    name: 'Acalentar',
    type: 'habilidade',
    description: 'Acalma uma pessoa usando fé.',
    metadata: {
      origem: 'Religião'
    }
  }

  ,

  // mais PERÍCIAS
  {
    name: 'Furtividade',
    type: 'pericia',
    description: 'Movimentação silenciosa e ocultação.',
    metadata: { atributo: 'agilidade' }
  },
  {
    name: 'Percepção',
    type: 'pericia',
    description: 'Detectar detalhes e perceber perigos.',
    metadata: { atributo: 'presenca' }
  },
  {
    name: 'Investigação',
    type: 'pericia',
    description: 'Analisar pistas e resolver mistérios.',
    metadata: { atributo: 'intelecto' }
  },
  {
    name: 'Persuasão',
    type: 'pericia',
    description: 'Convencer ou negociar com outros.',
    metadata: { atributo: 'presenca' }
  },

  // mais RITUAIS
  {
    name: 'Proteção',
    type: 'ritual',
    description: 'Cria uma barreira protetora temporária.',
    metadata: {
      circulo: 1,
      alcance: '3m',
      duracao: '1 rodada',
      efeito: 'Concede +2 para resistência por 1 rodada'
    }
  },
  {
    name: 'Purificação',
    type: 'ritual',
    description: 'Remove malefícios e venenos leves.',
    metadata: { circulo: 2, alcance: 'toque', efeito: 'Remove condição: envenenado' }
  },

  // mais HABILIDADES
  {
    name: 'Cura Rápida',
    type: 'habilidade',
    description: 'Pequena cura empática para aliados próximos.',
    metadata: { origem: 'Medicina', custo: '1 ação', efeito: 'Recupera 1d8 PV' }
  },
  {
    name: 'Conhecimento Arcano',
    type: 'habilidade',
    description: 'Conhecimentos mágicos que ajudam a identificar rituais.',
    metadata: { origem: 'Academia' }
  },
  {
    name: 'Aprimorar Arma',
    type: 'habilidade',
    description: 'Melhora temporariamente uma arma do usuário.',
    metadata: { origem: 'Ofício', efeito: '+1 dano por 3 turnos' }
  }

];

// 🔥 função de insert/upsert (idempotente por nome)
const insertFeature = async (feature) => {
  try {
    const rows = await new Promise((resolve, reject) => db.query(`SELECT id FROM features WHERE name = ?`, [feature.name], (err, r) => err ? reject(err) : resolve(r)));
    if (rows && rows.length > 0) {
      // update
      const hasEnc = feature.metadata && feature.metadata.penalidade_carga ? 1 : 0;
      const encVal = hasEnc ? (feature.metadata.encumbrance_penalty || 0) : null;
      await new Promise((resolve, reject) => db.query(`UPDATE features SET type = ?, description = ?, metadata = ?, has_encumbrance_penalty = ?, encumbrance_penalty = ? WHERE id = ?`, [feature.type, feature.description, JSON.stringify(feature.metadata), hasEnc, encVal, rows[0].id], (err) => err ? reject(err) : resolve()));
      console.log(`✔ Feature atualizada: ${feature.name}`);
    } else {
      const hasEnc = feature.metadata && feature.metadata.penalidade_carga ? 1 : 0;
      const encVal = hasEnc ? (feature.metadata.encumbrance_penalty || 0) : null;
      await new Promise((resolve, reject) => db.query(`INSERT INTO features (name, type, description, metadata, has_encumbrance_penalty, encumbrance_penalty) VALUES (?, ?, ?, ?, ?, ?)`, [feature.name, feature.type, feature.description, JSON.stringify(feature.metadata), hasEnc, encVal], (err) => err ? reject(err) : resolve()));
      console.log(`✔ Feature inserida: ${feature.name}`);
    }
  } catch (err) {
    console.error(`Erro ao inserir/atualizar ${feature.name}:`, err);
  }
};

const seed = async () => {
  console.log('🌱 Iniciando seed...');

  for (const f of features) {
    // eslint-disable-next-line no-await-in-loop
    await insertFeature(f);
  }

  // ------------------------
  // Protection templates (catalog) - idempotent
  const templates = [
    { name: 'Colete Balístico Nível I', passive_defense: 2, damage_resistance: 2, encumbrance_penalty: 1, description: 'Colete leve, reduz dano balístico leve.' },
    { name: 'Colete Balístico Nível II', passive_defense: 4, damage_resistance: 4, encumbrance_penalty: 2, description: 'Colete padrão de segurança, boa proteção.' },
    { name: 'Escudo Tático', passive_defense: 3, damage_resistance: 3, encumbrance_penalty: 3, description: 'Escudo portátil para cobertura.' }
  ];

  const insertTemplate = async (t) => {
    try {
      const rows = await new Promise((resolve, reject) => db.query(`SELECT id FROM protection_templates WHERE name = ?`, [t.name], (err, r) => err ? reject(err) : resolve(r)));
      if (rows && rows.length > 0) {
        await new Promise((resolve, reject) => db.query(`UPDATE protection_templates SET description = ?, passive_defense = ?, damage_resistance = ?, encumbrance_penalty = ?, metadata = ? WHERE id = ?`, [t.description, t.passive_defense, t.damage_resistance, t.encumbrance_penalty, JSON.stringify(t.metadata||{}), rows[0].id], (err) => err ? reject(err) : resolve()));
        console.log(`✔ Template atualizado: ${t.name}`);
      } else {
        await new Promise((resolve, reject) => db.query(`INSERT INTO protection_templates (name, description, passive_defense, damage_resistance, encumbrance_penalty, default_equipped, metadata, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [t.name, t.description, t.passive_defense || 0, t.damage_resistance || 0, t.encumbrance_penalty || 0, t.default_equipped ? 1 : 0, JSON.stringify(t.metadata || {}), null], (err) => err ? reject(err) : resolve()));
        console.log(`✔ Template inserido: ${t.name}`);
      }
    } catch (err) {
      console.error(`Erro ao inserir/atualizar template ${t.name}:`, err);
    }
  };

  for (const tpl of templates) {
    // eslint-disable-next-line no-await-in-loop
    await insertTemplate(tpl);
  }

  console.log('✅ Seed finalizada');
  process.exit();
};

seed();