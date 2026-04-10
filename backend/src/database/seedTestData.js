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
    console.log('🌱 Iniciando seed de teste...');

    // 🧑 1. Criar usuário
    const password = await bcrypt.hash('1234', 10);

    const userResult = await query(
      `INSERT INTO users (name, email, password)
       VALUES (?, ?, ?)`,
      ['Teste', 'teste@email.com', password]
    );

    const userId = userResult.insertId;

    console.log('✔ Usuário criado:', userId);

    // 🧍 2. Criar personagem
    const charResult = await query(
      `INSERT INTO characters (
        user_id, name, classe, nex, nivel,
        vida_atual, vida_max,
        sanidade_atual, sanidade_max,
        esforco_atual, esforco_max
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Agente Teste',
        'Combatente',
        20,
        4,
        15,
        20,
        12,
        16,
        3,
        5
      ]
    );

    const characterId = charResult.insertId;

    console.log('✔ Personagem criado:', characterId);

    // 💪 3. Criar atributos
    await query(
      `INSERT INTO attributes (character_id, forca, agilidade, intelecto, vigor, presenca)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [characterId, 3, 2, 1, 2, 1]
    );

    console.log('✔ Atributos criados');

    // 🔍 4. Buscar features base
    const features = await query(`SELECT * FROM features`);

    // pegar só algumas
    const luta = features.find(f => f.name === 'Luta');
    const ritual = features.find(f => f.name === 'Cicatrização');
    const habilidade = features.find(f => f.name === 'Acalentar');

    // 🔗 5. Vincular features

    if (luta) {
      await query(
        `INSERT INTO character_features
        (character_id, feature_id, value, training_level, extra)
        VALUES (?, ?, ?, ?, ?)`,
        [characterId, luta.id, 3, 'veteran', 2]
      );
      console.log('✔ Luta vinculada');
    }

    if (ritual) {
      await query(
        `INSERT INTO character_features
        (character_id, feature_id)
        VALUES (?, ?)`,
        [characterId, ritual.id]
      );
      console.log('✔ Ritual vinculado');
    }

    if (habilidade) {
      await query(
        `INSERT INTO character_features
        (character_id, feature_id)
        VALUES (?, ?)`,
        [characterId, habilidade.id]
      );
      console.log('✔ Habilidade vinculada');
    }

    console.log('✅ Seed de teste finalizada');
    process.exit();

  } catch (err) {
    console.error('Erro no seed:', err);
    process.exit(1);
  }
};

seed();