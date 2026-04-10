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
      await new Promise((resolve, reject) => db.query(`UPDATE features SET type = ?, description = ?, metadata = ? WHERE id = ?`, [feature.type, feature.description, JSON.stringify(feature.metadata), rows[0].id], (err) => err ? reject(err) : resolve()));
      console.log(`✔ Feature atualizada: ${feature.name}`);
    } else {
      await new Promise((resolve, reject) => db.query(`INSERT INTO features (name, type, description, metadata) VALUES (?, ?, ?, ?)`, [feature.name, feature.type, feature.description, JSON.stringify(feature.metadata)], (err) => err ? reject(err) : resolve()));
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

  console.log('✅ Seed finalizada');
  process.exit();
};

seed();