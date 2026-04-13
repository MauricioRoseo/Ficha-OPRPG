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

};

module.exports = FeatureService;