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

];

// 🔥 função de insert
const insertFeature = (feature) => {
  const sql = `
    INSERT INTO features (name, type, description, metadata)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      metadata = VALUES(metadata)
  `;

  db.query(
    sql,
    [
      feature.name,
      feature.type,
      feature.description,
      JSON.stringify(feature.metadata)
    ],
    (err) => {
      if (err) {
        console.error(`Erro ao inserir ${feature.name}:`, err);
      } else {
        console.log(`✔ Feature inserida/atualizada: ${feature.name}`);
      }
    }
  );
};

const seed = () => {
  console.log('🌱 Iniciando seed...');

  features.forEach(insertFeature);

  setTimeout(() => {
    console.log('✅ Seed finalizada');
    process.exit();
  }, 1000);
};

seed();