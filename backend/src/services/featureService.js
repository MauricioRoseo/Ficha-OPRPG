const FeatureModel = require('../models/featureModel');

// 🔥 bônus por nível de treinamento
const trainingBonus = {
  none: 0,
  trained: 5,
  veteran: 10,
  expert: 15
};

const FeatureService = {

  createFeature: (data, callback) => {
    FeatureModel.create(data, callback);
  },

  getAllFeatures: (callback) => {
    FeatureModel.findAll(callback);
  },

  addFeatureToCharacter: (characterId, featureId, data, callback) => {
    // First read the canonical feature to snapshot its metadata into the character row
    FeatureModel.findById(featureId, (err, featureRow) => {
      if (err) return callback(err);
      if (!featureRow) return callback(new Error('Feature not found'));

      const payload = Object.assign({}, data, {
        template_id: featureRow.id,
        template_name: featureRow.name,
        template_description: featureRow.description,
        template_metadata: featureRow.metadata,
        has_encumbrance_penalty: featureRow.has_encumbrance_penalty ? 1 : 0,
        encumbrance_penalty: featureRow.encumbrance_penalty !== undefined ? featureRow.encumbrance_penalty : null
      });

      FeatureModel.addToCharacter(characterId, featureId, payload, callback);
    });
  },

  removeFeatureFromCharacter: (characterId, charFeatureId, userId, callback) => {
    // verify character ownership then delete the character_feature row
    const CharacterModel = require('../models/characterModel');
    CharacterModel.findById(characterId, (err, character) => {
      if (err) return callback(err);
      if (!character) return callback(new Error('Personagem não encontrado'));
      if (character.user_id !== userId) return callback(new Error('Acesso negado'));

      // ensure the feature belongs to this character
      FeatureModel.getByCharacter(characterId, (err2, features) => {
        if (err2) return callback(err2);
        const found = features.find(f => String(f.id) === String(charFeatureId));
        if (!found) return callback(new Error('Perícia não encontrada neste personagem'));

        FeatureModel.removeCharacterFeature(charFeatureId, (err3, result) => {
          if (err3) return callback(err3);
          callback(null, result);
        });
      });
    });
  },

  // 🔥 versão com metadata + cálculo
  getCharacterFeaturesGrouped: (characterId, callback) => {
    FeatureModel.getByCharacter(characterId, (err, results) => {
      if (err) return callback(err);

      const grouped = {
        pericia: [],
        habilidade: [],
        poder: [],
        ritual: [],
        origem: [],
        trilha: [],
        regra_casa: []
      };

      results.forEach(f => {
        if (!grouped[f.type]) {
          grouped[f.type] = [];
        }

        // 🔥 tratamento especial para perícia
        if (f.type === 'pericia') {
          const atributo = f.metadata?.atributo || null;

          // Ordem Paranormal: o atributo base não soma no total da perícia;
          // ele apenas determina quais dados rolar. Portanto o total da perícia
          // é composto apenas pelo bônus de treinamento e bônus extra.
          const total =
            (trainingBonus[f.training_level] || 0) +
            (f.extra || 0);

          grouped[f.type].push({
            id: f.id,
            name: f.name,
            description: f.description || '',
            atributo,
            total,
            training_level: f.training_level,
            extra: f.extra,
            // penalidade_carga: whether this pericia supports encumbrance penalty
            penalidade_carga: (f.encumbrance_penalty !== null),
            // current encumbrance penalty value applied to this character (if supported)
            encumbrance_penalty: f.encumbrance_penalty !== null ? Number(f.encumbrance_penalty) : null
          });

        } else {
          grouped[f.type].push(f);
        }
      });

      callback(null, grouped);
    });
  }

  ,

  updateCharacterFeature: (characterId, charFeatureId, data, userId, callback) => {
    const CharacterModel = require('../models/characterModel');
    // verify ownership
    CharacterModel.findById(characterId, (err, character) => {
      if (err) return callback(err);
      if (!character) return callback(new Error('Personagem não encontrado'));
      if (character.user_id !== userId) return callback(new Error('Acesso negado'));

      // ensure the character actually has this feature
      FeatureModel.getByCharacter(characterId, (err2, features) => {
        if (err2) return callback(err2);
        const found = features.find(f => String(f.id) === String(charFeatureId));
        if (!found) return callback(new Error('Perícia não encontrada neste personagem'));

        // perform update
        FeatureModel.updateCharacterFeature(charFeatureId, data, (err3, result) => {
          if (err3) return callback(err3);
          callback(null, result);
        });
      });
    });
  }

};

module.exports = FeatureService;