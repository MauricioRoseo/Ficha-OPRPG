const CharacterModel = require('../models/characterModel');
const AttributeModel = require('../models/attributeModel');
const FeatureService = require('./featureService');

// Serviço responsável por operações com personagens e cálculo de status máximos
const CharacterService = {
  createCharacter: (data, callback) => {
    if (data.level_mode === 'auto') data.nivel = Math.floor(data.nex / 5);

    CharacterModel.create(data, (err, result) => {
      if (err) return callback(err);
      const characterId = result.insertId;
      AttributeModel.create(characterId, (err2) => {
        if (err2) return callback(err2);
        return callback(null, result);
      });
    });
  },

  getAllCharacters: (callback) => {
    CharacterModel.findAll(callback);
  },

  getCharactersByUser: (userId, callback) => {
    CharacterModel.findByUserId(userId, callback);
  },

  // Retorna personagem completo com cálculos de status (não persiste aqui)
  getFullCharacter: (characterId, userId, callback) => {
    CharacterModel.findById(characterId, (err, character) => {
      if (err) return callback(err);
      if (!character) return callback({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return callback({ message: 'Acesso negado' });

      AttributeModel.findByCharacterId(characterId, (err2, attributes) => {
        if (err2) return callback(err2);
        const attr = attributes[0] || { vigor: 0, presenca: 0, forca: 0 };

        FeatureService.getCharacterFeaturesGrouped(characterId, (err3, features) => {
          if (err3) return callback(err3);

          const ProtectionModel = require('../models/protectionModel');
          const ResistanceModel = require('../models/resistanceModel');
          const InventoryModel = require('../models/inventoryModel');
          const BackgroundModel = require('../models/backgroundModel');
          const CharacterPhobiaModel = require('../models/characterPhobiaModel');
          const ParanormalModel = require('../models/paranormalModel');

          // helper para cálculo de max
          const computeMaxFromClass = (classData) => {
            const cls = classData || {};
            const hp_initial = Number(cls.hp_initial || 0);
            const hp_per_level = Number(cls.hp_per_level || 0);
            const effort_initial = Number(cls.effort_initial || 0);
            const effort_per_level = Number(cls.effort_per_level || 0);
            const sanity_initial = Number(cls.sanity_initial || 0);
            const sanity_per_level = Number(cls.sanity_per_level || 0);

            const vigor = Number(attr.vigor || 0);
            const presenca = Number(attr.presenca || 0);
            const nivel = Number(character.nivel || 1);

            let formula = character.status_formula || null;
            if (typeof formula === 'string' && formula.length) {
              try { formula = JSON.parse(formula); } catch (e) { formula = null; }
            }

            const sumModifiers = (mods) => {
              if (!mods || !Array.isArray(mods)) return 0;
              return mods.reduce((s, m) => s + (Number(m && m.value) || 0), 0);
            };

            const vida_per_level_mod = sumModifiers((formula && formula.vida && formula.vida.modifiers_per_level) || []);
            const vida_flat_mod = sumModifiers((formula && formula.vida && formula.vida.modifiers_flat) || []);

            const esforco_per_level_mod = sumModifiers((formula && formula.esforco && formula.esforco.modifiers_per_level) || []);
            const esforco_flat_mod = sumModifiers((formula && formula.esforco && formula.esforco.modifiers_flat) || []);

            const sanidade_per_level_mod = sumModifiers((formula && formula.sanidade && formula.sanidade.modifiers_per_level) || []);
            const sanidade_flat_mod = sumModifiers((formula && formula.sanidade && formula.sanidade.modifiers_flat) || []);

            const vidaMax = Math.max(0, (hp_initial + vigor) + ((hp_per_level + vigor) * Math.max(0, (nivel - 1))) + (vida_per_level_mod * nivel) + vida_flat_mod);
            const esforcoMax = Math.max(0, (effort_initial + presenca) + ((effort_per_level + presenca) * Math.max(0, (nivel - 1))) + (esforco_per_level_mod * nivel) + esforco_flat_mod);
            const sanidadeMax = Math.max(0, sanity_initial + (sanity_per_level * Math.max(0, (nivel - 1))) + (sanidade_per_level_mod * nivel) + sanidade_flat_mod);

            return { vida_max: vidaMax, esforco_max: esforcoMax, sanidade_max: sanidadeMax };
          };

          const ClassModel = require('../models/classModel');
          const classId = character.classe_id || null;

          const afterClass = (classData) => {
            // protections
            ProtectionModel.findByCharacterId(characterId, (err4, protections) => {
              if (err4) return callback(err4);

              ResistanceModel.findByCharacterId(characterId, (err5, resistances) => {
                if (err5) return callback(err5);

                InventoryModel.findByCharacterId(characterId, (err6, items) => {
                  if (err6) return callback(err6);
                  const inventory = items || [];
                  const cargaAtual = inventory.reduce((acc, it) => acc + (Number(it.space) || 0), 0);
                  const cargaMaxima = (Number(attr.forca) > 0) ? (Number(attr.forca) * 5) : 2;

                  BackgroundModel.findByCharacterId(characterId, (err7, background) => {
                    if (err7) return callback(err7);

                    CharacterPhobiaModel.findByCharacterId(characterId, (err8, phobias) => {
                      if (err8) return callback(err8);

                      ParanormalModel.findByCharacterId(characterId, (err9, encounters) => {
                        if (err9) return callback(err9);

                        const computed = computeMaxFromClass(classData);
                        character.carga_atual = cargaAtual;
                        character.carga_maxima = cargaMaxima;
                        character.vida_max = computed.vida_max;
                        character.esforco_max = computed.esforco_max;
                        character.sanidade_max = computed.sanidade_max;

                        return callback(null, {
                          character,
                          attributes: attr,
                          features,
                          protections: protections || [],
                          resistances: resistances || {},
                          inventory: inventory,
                          background: background || null,
                          phobias: phobias || [],
                          paranormal_encounters: encounters || []
                        });
                      });
                    });
                  });
                });
              });
            });
          };

          if (classId) {
            ClassModel.findById(classId, (errC, clsRes) => {
              const classData = (clsRes && clsRes.length && clsRes[0]) ? clsRes[0] : null;
              afterClass(classData);
            });
          } else {
            afterClass(null);
          }
        });
      });
    });
  },

  // atualiza campos de status e proficiências
  updateCharacter: (characterId, userId, data, callback) => {
    const CharacterModelLocal = require('../models/characterModel');

    CharacterModelLocal.findById(characterId, (err, character) => {
      if (err) return callback(err);
      if (!character) return callback({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return callback({ message: 'Acesso negado' });

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
        proficiencias: data.proficiencias,
        patrimonio: data.patrimonio
      };

      CharacterModelLocal.update(characterId, payload, (err2) => {
        if (err2) return callback(err2);
        if (data.proficiencias !== undefined) {
          // recompute patente
          let prestigio = 0;
          try {
            const lines = (data.proficiencias || '').split(/\r?\n/);
            if (lines[0] && /\d+/.test(lines[0])) {
              const m = lines[0].match(/(\d+)/);
              if (m) prestigio = Number(m[1]);
            }
          } catch (e) { prestigio = 0; }

          const computePatente = (p) => {
            if (p >= 200) return 'Agente de Elite';
            if (p >= 100) return 'Oficial de Operações';
            if (p >= 50) return 'Agente Especial';
            if (p >= 20) return 'Operador';
            return 'Recruta';
          };

          const patente = computePatente(prestigio);
          CharacterModelLocal.updateProficiencies(characterId, data.proficiencias, prestigio, patente, (err3) => {
            if (err3) return callback(err3);
            callback(null, { message: 'Status e proficiências atualizados', prestigio, patente });
          });
        } else {
          callback(null, { message: 'Status atualizados' });
        }
      });
    });
  },

  // Recalculate and persist max stats for a character
  recalculateStatusMax: (characterId, callback) => {
    CharacterModel.findById(characterId, (err, character) => {
      if (err) return callback(err);
      if (!character) return callback({ message: 'Personagem não encontrado' });

      AttributeModel.findByCharacterId(characterId, (err2, attributes) => {
        if (err2) return callback(err2);
        const attr = attributes[0] || { vigor: 0, presenca: 0 };
        const vigor = Number(attr.vigor || 0);
        const presenca = Number(attr.presenca || 0);
        const nivel = Number(character.nivel || 1);

        const ClassModel = require('../models/classModel');

        const parseFormula = (raw) => {
          if (!raw) return null;
          if (typeof raw === 'object') return raw;
          try { return JSON.parse(raw); } catch (e) { return null; }
        };

        const sumModifiers = (mods) => {
          if (!mods || !Array.isArray(mods)) return 0;
          return mods.reduce((s, m) => s + (Number(m && m.value) || 0), 0);
        };

        const doComputeAndUpdate = (cls) => {
          const hp_initial = Number((cls && cls.hp_initial) || 0);
          const hp_per_level = Number((cls && cls.hp_per_level) || 0);
          const effort_initial = Number((cls && cls.effort_initial) || 0);
          const effort_per_level = Number((cls && cls.effort_per_level) || 0);
          const sanity_initial = Number((cls && cls.sanity_initial) || 0);
          const sanity_per_level = Number((cls && cls.sanity_per_level) || 0);

          const formula = parseFormula(character.status_formula);

          const vida_per_level_mod = sumModifiers((formula && formula.vida && formula.vida.modifiers_per_level) || []);
          const vida_flat_mod = sumModifiers((formula && formula.vida && formula.vida.modifiers_flat) || []);

          const esforco_per_level_mod = sumModifiers((formula && formula.esforco && formula.esforco.modifiers_per_level) || []);
          const esforco_flat_mod = sumModifiers((formula && formula.esforco && formula.esforco.modifiers_flat) || []);

          const sanidade_per_level_mod = sumModifiers((formula && formula.sanidade && formula.sanidade.modifiers_per_level) || []);
          const sanidade_flat_mod = sumModifiers((formula && formula.sanidade && formula.sanidade.modifiers_flat) || []);

          const vidaMax = Math.max(0, (hp_initial + vigor) + ((hp_per_level + vigor) * Math.max(0, (nivel - 1))) + (vida_per_level_mod * nivel) + vida_flat_mod);
          const esforcoMax = Math.max(0, (effort_initial + presenca) + ((effort_per_level + presenca) * Math.max(0, (nivel - 1))) + (esforco_per_level_mod * nivel) + esforco_flat_mod);
          const sanidadeMax = Math.max(0, sanity_initial + (sanity_per_level * Math.max(0, (nivel - 1))) + (sanidade_per_level_mod * nivel) + sanidade_flat_mod);

          CharacterModel.updateMaxStats(characterId, vidaMax, esforcoMax, sanidadeMax, (err3) => {
            if (err3) return callback(err3);
            return callback(null, { vida_max: vidaMax, esforco_max: esforcoMax, sanidade_max: sanidadeMax });
          });
        };

        const classId = character.classe_id || null;
        if (classId) {
          ClassModel.findById(classId, (err3, clsRes) => {
            const classData = (clsRes && clsRes.length && clsRes[0]) ? clsRes[0] : null;
            doComputeAndUpdate(classData);
          });
        } else doComputeAndUpdate(null);
      });
    });
  }
};

module.exports = CharacterService;