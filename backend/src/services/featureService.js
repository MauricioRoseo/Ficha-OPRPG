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
    FeatureModel.addToCharacter(characterId, featureId, data, callback);
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

          const total =
            (f.value || 0) +
            (trainingBonus[f.training_level] || 0) +
            (f.extra || 0);

          grouped[f.type].push({
            id: f.id,
            name: f.name,
            atributo,
            total,
            training_level: f.training_level,
            extra: f.extra,
            penalidade_carga: f.metadata?.penalidade_carga || false
          });

        } else {
          grouped[f.type].push(f);
        }
      });

      callback(null, grouped);
    });
  }

};

module.exports = FeatureService;