const CharacterModel = require('../models/characterModel');
const AttributeModel = require('../models/attributeModel');
const FeatureService = require('./featureService');

const CharacterService = {
  createCharacter: (data, callback) => {
    if (data.level_mode === 'auto') {
      data.nivel = Math.floor(data.nex / 5);
    }

    CharacterModel.create(data, (err, result) => {
      if (err) return callback(err);

      const characterId = result.insertId;

      // 🔥 cria atributos automaticamente
      AttributeModel.create(characterId, (err2) => {
        if (err2) return callback(err2);

        callback(null, result);
      });
    });
  },

  getAllCharacters: (callback) => {
    CharacterModel.findAll(callback);
  },

  getCharactersByUser: (userId, callback) => {
    CharacterModel.findByUserId(userId, callback);
  },

  getFullCharacter: (characterId, userId, callback) => {
    const CharacterModel = require('../models/characterModel');
    const AttributeModel = require('../models/attributeModel');
    const FeatureService = require('./featureService');

    CharacterModel.findById(characterId, (err, character) => {
      if (err) return callback(err);

      if (!character) {
        return callback({ message: 'Personagem não encontrado' });
      }

      // 🔒 validação de dono
      if (character.user_id !== userId) {
        return callback({ message: 'Acesso negado' });
      }

      // 🔥 atributos
      AttributeModel.findByCharacterId(characterId, (err2, attributes) => {
        if (err2) return callback(err2);

        // 🔥 features
        FeatureService.getCharacterFeaturesGrouped(characterId, (err3, features) => {
          if (err3) return callback(err3);

          // 🔒 protections
          const ProtectionModel = require('../models/protectionModel');
          ProtectionModel.findByCharacterId(characterId, (err4, protections) => {
            if (err4) return callback(err4);

                  // resistances
                  const ResistanceModel = require('../models/resistanceModel');
                  ResistanceModel.findByCharacterId(characterId, (err5, resistances) => {
                    if (err5) return callback(err5);

                    callback(null, {
                      character,
                      attributes: attributes[0] || {},
                      features,
                      protections: protections || [],
                      resistances: resistances || {}
                    });
                  });
          });
        });
      });
    });
  }

    ,

    updateCharacter: (characterId, userId, data, callback) => {
      // valida dono antes de atualizar
      const CharacterModel = require('../models/characterModel');

      CharacterModel.findById(characterId, (err, character) => {
        if (err) return callback(err);
        if (!character) return callback({ message: 'Personagem não encontrado' });

        if (character.user_id !== userId) return callback({ message: 'Acesso negado' });

        // atualiza campos permitidos
        const payload = {
          vida_atual: data.vida_atual,
          vida_temp: data.vida_temp,
          esforco_atual: data.esforco_atual,
          esforco_temp: data.esforco_temp,
          sanidade_atual: data.sanidade_atual,
          defesa_passiva: data.defesa_passiva,
          esquiva: data.esquiva,
          bloqueio: data.bloqueio,
          morrendo: data.morrendo,
          enlouquecendo: data.enlouquecendo,
        };

        CharacterModel.update(characterId, payload, (err2) => {
          if (err2) return callback(err2);
          callback(null, { message: 'Status atualizados' });
        });
      });
    }
};

module.exports = CharacterService;