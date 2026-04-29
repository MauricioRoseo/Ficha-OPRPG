const CharacterService = require('../services/characterService');

const CharacterController = {
  create: (req, res) => {
    const payload = req.body || {};
    const user = req.user || {};

    // allow elevated users to create characters for others
    if (user && (user.role === 'master' || user.role === 'admin')) {
      // allow provided user_id, fallback to creator
      payload.user_id = payload.user_id || user.id;
    } else {
      // normal players always create for themselves and get default level/nex
      payload.user_id = user.id;
      payload.nivel = 1;
      payload.nex = 5;
    }

    // validate required attributes for initial creation
    const attrs = payload.attributes || {
      forca: payload.forca,
      agilidade: payload.agilidade,
      intelecto: payload.intelecto,
      vigor: payload.vigor,
      presenca: payload.presenca
    };

    if (!attrs || typeof attrs !== 'object') return res.status(400).json({ message: 'Atributos inválidos' });
    const attrKeys = ['forca','agilidade','intelecto','vigor','presenca'];
    for (const k of attrKeys) {
      if (attrs[k] === undefined || attrs[k] === null || isNaN(Number(attrs[k]))) return res.status(400).json({ message: `Atributo ${k} inválido` });
      const v = Number(attrs[k]);
      if (v < 0 || v > 3) return res.status(400).json({ message: `Atributo ${k} deve estar entre 0 e 3` });
    }
    const sum = attrKeys.reduce((s,k)=>s + Number(attrs[k]||0), 0);
    if (sum !== 9) return res.status(400).json({ message: 'A soma dos 5 atributos deve ser igual a 9' });

    // attach normalized attributes to payload for the service
    payload.attributes = {
      forca: Number(attrs.forca),
      agilidade: Number(attrs.agilidade),
      intelecto: Number(attrs.intelecto),
      vigor: Number(attrs.vigor),
      presenca: Number(attrs.presenca)
    };

    CharacterService.createCharacter(payload, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err });
      }

      res.status(201).json({ message: 'Personagem criado com sucesso!', id: result.insertId });
    });
  },

  delete: (req, res) => {
    const { id } = req.params; // character id
    const user = req.user || {};
    const CharacterModel = require('../models/characterModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return res.status(403).json({ message: 'Acesso negado' });

      CharacterModel.deleteById(id, (err2) => {
        if (err2) return res.status(500).json(err2);
        res.json({ message: 'Personagem removido' });
      });
    });
  },

  findAll: (req, res) => {
    // if master/admin, return all characters; otherwise return only user's characters
    const user = req.user || {};
    if (user.role === 'master' || user.role === 'admin') {
      CharacterService.getAllCharacters((err, results) => {
        if (err) return res.status(500).json(err);
        return res.json(results);
      });
    } else {
      CharacterService.getCharactersByUser(user.id, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
      });
    }
  },

  getFull: (req, res) => {
    const { id } = req.params;
    const user = req.user || {};

    CharacterService.getFullCharacter(id, user, (err, result) => {
      if (err) {
        // 🔥 trata erro corretamente
        if (err.message === 'Acesso negado') {
          return res.status(403).json(err);
        }

        return res.status(500).json(err);
      }

      res.json(result);
    });
  }
,

  update: (req, res) => {
    const { id } = req.params;

  const user = req.user || {};
  const data = req.body;

    // no debug logs

    CharacterService.updateCharacter(id, user, data, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json(err);
        return res.status(500).json(err);
      }

      res.json(result);
    });
  }
,

  updateBackground: (req, res) => {
    const { id } = req.params; // character id
    const user = req.user || {};
    const payload = req.body || {};

    const CharacterModel = require('../models/characterModel');
    const BackgroundModel = require('../models/backgroundModel');
    const CharacterPhobiaModel = require('../models/characterPhobiaModel');
    const ParanormalModel = require('../models/paranormalModel');

    // validate owner
    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) return res.status(403).json({ message: 'Acesso negado' });

      // upsert background
      BackgroundModel.findByCharacterId(id, (err2, bg) => {
        if (err2) return res.status(500).json(err2);

        const doPhobias = (cb) => {
          if (payload.phobias !== undefined) {
            CharacterPhobiaModel.replaceForCharacter(id, payload.phobias || [], cb);
          } else cb(null, { affectedRows: 0 });
        };

        const doEncounters = (cb) => {
          if (payload.paranormal_encounters !== undefined) {
            ParanormalModel.replaceForCharacter(id, payload.paranormal_encounters || [], cb);
          } else cb(null, { affectedRows: 0 });
        };

        if (!bg) {
          BackgroundModel.create(id, payload, (err3) => {
            if (err3) return res.status(500).json(err3);
            // then handle phobias and encounters
            doPhobias((err4) => {
              if (err4) return res.status(500).json(err4);
              doEncounters((err5) => {
                if (err5) return res.status(500).json(err5);
                return res.json({ message: 'Antecedentes criados' });
              });
            });
          });
        } else {
          BackgroundModel.update(id, payload, (err6) => {
            if (err6) return res.status(500).json(err6);
            doPhobias((err7) => {
              if (err7) return res.status(500).json(err7);
              doEncounters((err8) => {
                if (err8) return res.status(500).json(err8);
                return res.json({ message: 'Antecedentes atualizados' });
              });
            });
          });
        }
      });
    });
  },

  getPatrimonio: (req, res) => {
    const { id } = req.params; // character id
    const userId = req.user.id;
    const CharacterModel = require('../models/characterModel');
    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });
      return res.json({ id: character.id, patrimonio: character.patrimonio });
    });
  },

  createNote: (req, res) => {
    const { id } = req.params; // character id
    const userId = req.user.id;
    const payload = req.body || {};
    const CharacterModel = require('../models/characterModel');
    const CharacterNoteModel = require('../models/characterNoteModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

      CharacterNoteModel.create(id, payload, (err2, result) => {
        if (err2) return res.status(500).json(err2);
        res.status(201).json({ id: result.insertId });
      });
    });
  },

  updateNote: (req, res) => {
    const { id, noteId } = req.params;
    const userId = req.user.id;
    const payload = req.body || {};
    const CharacterModel = require('../models/characterModel');
    const CharacterNoteModel = require('../models/characterNoteModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

      // ensure note exists and belongs to character
      CharacterNoteModel.findById(noteId, (err2, note) => {
        if (err2) return res.status(500).json(err2);
        if (!note || note.character_id !== Number(id)) return res.status(404).json({ message: 'Nota não encontrada' });

        CharacterNoteModel.update(noteId, payload, (err3) => {
          if (err3) return res.status(500).json(err3);
          res.json({ message: 'Nota atualizada' });
        });
      });
    });
  },

  deleteNote: (req, res) => {
    const { id, noteId } = req.params;
    const userId = req.user.id;
    const CharacterModel = require('../models/characterModel');
    const CharacterNoteModel = require('../models/characterNoteModel');

    CharacterModel.findById(id, (err, character) => {
      if (err) return res.status(500).json(err);
      if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
      if (character.user_id !== userId) return res.status(403).json({ message: 'Acesso negado' });

      CharacterNoteModel.findById(noteId, (err2, note) => {
        if (err2) return res.status(500).json(err2);
        if (!note || note.character_id !== Number(id)) return res.status(404).json({ message: 'Nota não encontrada' });

        CharacterNoteModel.deleteById(noteId, (err3) => {
          if (err3) return res.status(500).json(err3);
          res.json({ message: 'Nota apagada' });
        });
      });
    });
  }
};

// Level up endpoint: adjust nivel and/or nex and persist changes
CharacterController.levelUp = (req, res) => {
  const { id } = req.params;
  const user = req.user || {};
  const payload = req.body || {};
  const type = payload.type || 'level';

  const CharacterModel = require('../models/characterModel');
  const CharacterService = require('../services/characterService');

  CharacterModel.findById(id, (err, character) => {
    if (err) return res.status(500).json(err);
    if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
    const isOwner = character.user_id === (user && user.id);
    const isElevated = user && (user.role === 'master' || user.role === 'admin');
    if (!isOwner && !isElevated) return res.status(403).json({ message: 'Acesso negado' });

    const curLevel = Number(character.nivel) || 0;
    const curNex = Number(character.nex) || 0;
    let newLevel = curLevel;
    let newNex = curNex;

    if (type === 'level') newLevel = curLevel + 1;
    else if (type === 'nex') newNex = curNex + 5;
    else if (type === 'both') { newLevel = curLevel + 1; newNex = curNex + 5; }

    const selected_trilha_id = payload.selected_trilha_id !== undefined ? payload.selected_trilha_id : null;
    let selected_trilha_name = null;

    // affinity selection when crossing NEX 50
    const selected_afinidade = payload.selected_afinidade !== undefined ? payload.selected_afinidade : null;

    // If leveling to 2, require trilha selection (if not already set)
    const willReachLevel2 = (curLevel < 2 && newLevel >= 2);
    // If NEX crosses 50, require afinidade selection if character has none
    const willReachNex50 = (curNex < 50 && newNex >= 50);

    const TrailModel = require('../models/trailModel');
    const FeatureModel = require('../models/featureModel');

    let _ritualAdded = false;
    const applyUpdates = () => {
      // prepare merged payload similar to updateDetails to avoid overwriting fields
      const mergedPayload = {
        name: character.name,
        idade: character.idade,
        origem: character.origem,
        origem_id: character.origem_id,
        classe: character.classe,
        classe_id: character.classe_id,
        trilha: character.trilha,
        trilha_id: character.trilha_id,
        nivel: newLevel,
        nex: newNex,
        prestigio: character.prestigio,
        afinidade: character.afinidade,
        imagem_perfil: character.imagem_perfil,
        imagem_token: character.imagem_token,
        status_formula: character.status_formula,
        defense_formula: character.defense_formula
      };

      // if user provided trilha selection, persist it
      if (selected_trilha_id) {
        mergedPayload.trilha_id = selected_trilha_id;
      }
      if (selected_trilha_name) {
        mergedPayload.trilha = selected_trilha_name;
      }

      // if user provided afinidade selection, validate and persist it
      if (selected_afinidade) {
        const allowed = ['morte','sangue','energia','conhecimento'];
        const given = (String(selected_afinidade || '').trim()).toLowerCase();
        if (!allowed.includes(given)) return res.status(400).json({ message: 'Afinidade inválida' });
        mergedPayload.afinidade = given.charAt(0).toUpperCase() + given.slice(1);
      }

      CharacterModel.updateDetails(id, mergedPayload, (err2) => {
        if (err2) return res.status(500).json(err2);
        // after updating details, if we need to add lvl2 ability from trail
        const maybeAddTrailAbility = (next) => {
          // Only add trail lvl2 ability when the character is actually reaching level 2
          // (i.e., this levelUp operation increases level to 2). Do not add when only NEX is increased.
          if (!mergedPayload.trilha_id) return next();
          if (!willReachLevel2) return next();
          TrailModel.findByClassId(mergedPayload.classe_id, (errT, trails) => {
            if (errT) return res.status(500).json(errT);
            const found = (trails || []).find(t => t.id === Number(mergedPayload.trilha_id));
            if (!found) return res.status(400).json({ message: 'Trilha inválida' });
            const abilityId = found.ability_lvl_2_id || null;
            if (!abilityId) return next();
            // snapshot feature into character
            FeatureModel.findById(abilityId, (errF, feat) => {
              if (errF) return res.status(500).json(errF);
              if (!feat) return next();
              FeatureModel.addToCharacter(id, abilityId, {
                value: 0,
                training_level: 'none',
                extra: 0,
                notes: null,
                template_id: feat.id,
                template_name: feat.name,
                template_description: feat.description,
                template_metadata: feat.metadata,
                has_encumbrance_penalty: feat.has_encumbrance_penalty,
                encumbrance_penalty: feat.encumbrance_penalty
              }, (errAdd) => {
                if (errAdd) console.warn('Erro ao adicionar habilidade de trilha lvl2:', errAdd && errAdd.message);
                return next();
              });
            });
          });
        };

        const maybeAddRitual = (next) => {
          console.log('[levelUp] maybeAddRitual invoked with payload selected_ritual_id=', payload.selected_ritual_id);
          // support either a single selected_ritual_id or an array selected_ritual_ids
          let selected_ritual_id = payload.selected_ritual_id !== undefined ? payload.selected_ritual_id : null;
          if (!selected_ritual_id && Array.isArray(payload.selected_ritual_ids) && payload.selected_ritual_ids.length) selected_ritual_id = payload.selected_ritual_ids[0];
          // coerce to number when possible
          if (selected_ritual_id !== null) selected_ritual_id = Number(selected_ritual_id) || null;
          if (!selected_ritual_id) return next();
          // only allow for Ocultista class (by name contains 'ocult')
          let grantedByLevel = false;
          try {
            // prefer mergedPayload.class (updated value) but fallback to existing character
            const clsToCheck = (mergedPayload && mergedPayload.classe) ? mergedPayload.classe : (character && character.classe) || '';
            const clsName = (clsToCheck || '').toLowerCase();
            // determine whether ritual should be 'free' (granted by level) — occultistas gain ritual on level-ups
            const isOccult = clsName.includes('ocult');
            const isLevelIncrease = (newLevel > curLevel);
            grantedByLevel = isOccult && isLevelIncrease; // free ritual when occultista and leveling
            // allow adding ritual if it's a NEX transcension (type === 'nex') OR if grantedByLevel
            if (!grantedByLevel && type !== 'nex') {
              console.log('[levelUp] maybeAddRitual skipped — not a NEX change and not grantedByLevel', { type, grantedByLevel, clsToCheck });
              return next();
            }
          } catch (e) {
            console.log('[levelUp] maybeAddRitual skipped — error checking class', e && e.message);
            return next();
          }

          const AttributeModel = require('../models/attributeModel');
          const RitualModel = require('../models/ritualModel');
          const CharacterRitualModel = require('../models/characterRitualModel');

          AttributeModel.findByCharacterId(id, (errA, attrsRes) => {
            const attrs = (attrsRes && attrsRes.length) ? attrsRes[0] : {};
            const limiteGasto = Number(character.limite_gasto_pe || attrs.limite_gasto_pe || attrs.intelecto || 0);
            const presenca = Number(attrs.presenca || 0);
            const dt_resistencia_default = 10 + limiteGasto + presenca;
            const limite_rituais_default = Number(attrs.intelecto || 1);

            // ensure ritual exists
            console.log('[levelUp] attempting to add ritual', { characterId: id, selected_ritual_id, dt_resistencia_default, limite_rituais_default });
            RitualModel.findById(selected_ritual_id, (errR, ritualRow) => {
              if (errR) {
                console.error('[levelUp] error finding ritual:', errR);
                return next();
              }
              if (!ritualRow) {
                console.warn('[levelUp] ritual not found for id', selected_ritual_id);
                return next();
              }
              const circle = (ritualRow && (ritualRow.circle || ritualRow.circle === 0)) ? ritualRow.circle : null;
              console.log('[levelUp] ritual row', ritualRow);
              const proceedAdd = () => {
                // try addFromCatalog first — pass granted_by_level flag
                CharacterRitualModel.addFromCatalog(id, selected_ritual_id, { dt_resistencia: dt_resistencia_default, circulo: circle, limite_rituais: limite_rituais_default, granted_by_level: grantedByLevel }, (errCR, resultCR) => {
                  if (errCR) {
                    console.warn('Erro ao adicionar ritual selecionado no levelUp (addFromCatalog):', errCR && errCR.message);
                  } else {
                    // treat any successful response (no error) as insertion success — more robust across drivers
                    console.log('[levelUp] addFromCatalog callback OK', resultCR && (resultCR.insertId || resultCR.affectedRows));
                    _ritualAdded = true;
                    return next();
                  }

                  // fallback: create a custom snapshot using ritualRow fields
                  try {
                    const customPayload = {
                      name: ritualRow.name || null,
                      element: ritualRow.element || null,
                      description: ritualRow.description || ritualRow.effect || null,
                      execution: ritualRow.execution || null,
                      alcance: ritualRow.alcance || null,
                      alvo: ritualRow.alvo || null,
                      duration: ritualRow.duration || null,
                      resistencia_pericia_id: ritualRow.resistencia_pericia_id || null,
                      resistencia_pericia_name: null,
                      aprimoramento_discente: ritualRow.aprimoramento_discente || 0,
                      custo_aprimoramento_discente: ritualRow.custo_aprimoramento_discente || null,
                      descricao_aprimoramento_discente: ritualRow.descricao_aprimoramento_discente || null,
                      aprimoramento_verdadeiro: ritualRow.aprimoramento_verdadeiro || 0,
                      custo_aprimoramento_verdadeiro: ritualRow.custo_aprimoramento_verdadeiro || null,
                      descricao_aprimoramento_verdadeiro: ritualRow.descricao_aprimoramento_verdadeiro || null,
                      symbol_image: ritualRow.symbol_image || ritualRow.symbol || null,
                      symbol_image_secondary: ritualRow.symbol_image_secondary || ritualRow.symbol2 || null,
                      dt_resistencia: dt_resistencia_default,
                      limite_rituais: limite_rituais_default,
                      circulo: circle
                    };
                    CharacterRitualModel.createCustom(id, customPayload, (errC, resC) => {
                      if (errC) {
                        console.warn('Erro ao criar ritual customizado como fallback:', errC && errC.message);
                      } else {
                        console.log('[levelUp] createCustom fallback succeeded', resC && (resC.insertId || resC.affectedRows));
                        _ritualAdded = true;
                      }
                      return next();
                    });
                  } catch (e2) {
                    console.error('[levelUp] fallback createCustom exception', e2 && e2.message);
                    return next();
                  }
                });
              };

              // If ritual is not a grantedByLevel (i.e., regular NEX learned ritual), enforce limit
              if (!grantedByLevel) {
                const CharacterRitualModel = require('../models/characterRitualModel');
                CharacterRitualModel.getByCharacter(id, (errList, existingR) => {
                  if (errList) {
                    console.warn('[levelUp] could not fetch existing rituals to enforce limit:', errList && errList.message);
                    return proceedAdd();
                  }
                  // count only rituals that are not granted by level
                  const counted = (existingR || []).filter(r => !r.granted_by_level).length;
                  if (Number(counted) >= Number(limite_rituais_default)) {
                    console.log('[levelUp] ritual not added — character reached ritual limit', { counted, limite_rituais_default });
                    return next();
                  }
                  return proceedAdd();
                });
              } else {
                // granted by level — proceed without limit check
                CharacterRitualModel.addFromCatalog(id, selected_ritual_id, { dt_resistencia: dt_resistencia_default, circulo: circle, limite_rituais: limite_rituais_default, granted_by_level: grantedByLevel }, (errCR2, resultCR2) => {
                  if (errCR2) console.warn('Erro ao adicionar ritual por nivel (addFromCatalog):', errCR2 && errCR2.message);
                  else {
                    console.log('[levelUp] addFromCatalog (granted_by_level) OK', resultCR2 && (resultCR2.insertId || resultCR2.affectedRows));
                    _ritualAdded = true;
                  }
                  return next();
                });
              }
            });
          });
        };

        const callbackRecalc = () => {
          const CharacterService = require('../services/characterService');
          CharacterService.recalculateStatusMax(id, (err3, stats) => {
            if (err3) return res.status(500).json(err3);
            return res.json({ message: 'Level up aplicado', character: { nivel: newLevel, nex: newNex, trilha_id: mergedPayload.trilha_id, trilha: mergedPayload.trilha, afinidade: mergedPayload.afinidade || character.afinidade }, computed: stats, ritual_added: !!_ritualAdded });
          });
        };

        // Run trail ability addition first, then always attempt to add ritual, then recalc
        const maybeAddFeature = (nextFeature) => {
          // handle selected_feature_id or array selected_feature_ids
          let selFeat = payload.selected_feature_id !== undefined ? payload.selected_feature_id : null;
          if (!selFeat && Array.isArray(payload.selected_feature_ids) && payload.selected_feature_ids.length) selFeat = payload.selected_feature_ids[0];
          if (!selFeat) return nextFeature();
          // normalize to array
          const featsToAdd = Array.isArray(selFeat) ? selFeat.map(Number) : [Number(selFeat)];
          const FeatureModel = require('../models/featureModel');
          const FeatureService = require('../services/featureService');
          // fetch existing template_ids to avoid duplicates
          FeatureModel.getByCharacter(id, (errF, existing) => {
            if (errF) {
              console.warn('[levelUp] could not fetch existing features to avoid duplicates:', errF && errF.message);
              return nextFeature();
            }
            const existingTemplateIds = (existing || []).map(e => e.template_id).filter(Boolean).map(Number);
            const toAdd = featsToAdd.filter(f => f && !existingTemplateIds.includes(Number(f)));
            if (!toAdd.length) return nextFeature();
            const addNextFeat = (i) => {
              if (i >= toAdd.length) return nextFeature();
              const fid = Number(toAdd[i]);
              FeatureService.addFeatureToCharacter(Number(id), fid, { training_level: 'trained', value: 1 }, (errAdd) => {
                if (errAdd) console.warn('[levelUp] erro ao adicionar feature selecionada:', errAdd && errAdd.message);
                addNextFeat(i+1);
              });
            };
            addNextFeat(0);
          });
        };

        maybeAddTrailAbility(() => {
          maybeAddFeature(() => {
            maybeAddRitual(() => callbackRecalc());
          });
        });
      });
    };

    // If leveling to 2 and character has no trilha yet, require selection
    if (willReachLevel2 && (!character.trilha_id && !selected_trilha_id)) {
      return res.status(400).json({ message: 'Seleção de trilha necessária ao atingir nível 2' });
    }

    // If crossing NEX 50 and character has no afinidade, require selection
    if (willReachNex50 && (!character.afinidade && !selected_afinidade)) {
      return res.status(400).json({ message: 'Seleção de afinidade necessária ao atingir NEX 50' });
    }

    // If selected_trilha_id provided, validate it belongs to character's class
    if (selected_trilha_id) {
      TrailModel.findByClassId(character.classe_id, (errT2, trails2) => {
        if (errT2) return res.status(500).json(errT2);
        const foundObj = (trails2 || []).find(t => t.id === Number(selected_trilha_id));
        if (!foundObj) return res.status(400).json({ message: 'Trilha não pertence à classe do personagem' });
        selected_trilha_name = foundObj.name || null;
        applyUpdates();
      });
    } else {
      applyUpdates();
    }
  });
};

// Completa a criação do personagem aplicando escolhas de classe/perícias adicionais
CharacterController.completeCreation = (req, res) => {
  const { id } = req.params;
  const user = req.user || {};
  const payload = req.body || {};

  const CharacterModel = require('../models/characterModel');
  const FeatureService = require('../services/featureService');
  const CharacterService = require('../services/characterService');
    const AttributeModel = require('../models/attributeModel');
    const RitualModel = require('../models/ritualModel');
    const CharacterRitualModel = require('../models/characterRitualModel');

  CharacterModel.findById(id, (err, character) => {
    if (err) return res.status(500).json(err);
    if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
    const isOwner = character.user_id === (user && user.id);
    const isElevated = user && (user.role === 'master' || user.role === 'admin');
    if (!isOwner && !isElevated) return res.status(403).json({ message: 'Acesso negado' });

      // get existing features for this character to avoid duplicates
      const FeatureModel = require('../models/featureModel');
      FeatureModel.getByCharacter(id, (errFeat, existing) => {
        if (errFeat) return res.status(500).json(errFeat);
        const existingTemplateIds = (existing || []).map(e => e.template_id).filter(Boolean).map(Number);

        // start with requested additions
        let toAdd = Array.isArray(payload.selected_feature_ids) ? payload.selected_feature_ids.map(Number) : [];

        // also ensure class abilities are present (snap from class template)
        const ClassModel = require('../models/classModel');
        ClassModel.findById(character.classe_id, (errC, clsRes) => {
          if (!errC && clsRes && clsRes.length) {
            const cls = clsRes[0];
            if (cls.primary_ability_id) toAdd.push(Number(cls.primary_ability_id));
            if (cls.secondary_ability_id) toAdd.push(Number(cls.secondary_ability_id));
          }

          // if class is Ocultista, also try to add Ocultismo and Vontade by name (best-effort)
          try {
            const clsName = (character.classe || '').toLowerCase();
            if (clsName.includes('ocult')) {
              // try to find by name in features table
              const db = require('../config/database');
              db.query(`SELECT id FROM features WHERE name IN (?, ?)`, ['Ocultismo', 'Vontade'], (errDb, rows) => {
                if (!errDb && rows && rows.length) {
                  rows.forEach(r => toAdd.push(Number(r.id)));
                }
                continueAdding();
              });
              return;
            }
          } catch (e) { /* ignore */ }

          continueAdding();

          function continueAdding() {
            // deduplicate and skip ones already present by template_id
            toAdd = Array.from(new Set(toAdd)).filter(x => x && !existingTemplateIds.includes(Number(x)));

            const addNext = (i) => {
              if (i >= toAdd.length) {
                // after adding features, recalculate derived stats
                CharacterService.recalculateStatusMax(id, (err2, stats) => {
                  if (err2) return res.status(500).json(err2);
                  return res.json({ message: 'Escolhas aplicadas', computed: stats });
                });
                return;
              }
              const fid = toAdd[i];
              FeatureService.addFeatureToCharacter(Number(id), fid, { training_level: 'trained', value: 1 }, (errF) => {
                if (errF) console.warn('Erro ao adicionar escolha de perícia:', errF && errF.message);
                addNext(i+1);
              });
            };

            addNext(0);
          }
        });
        // also handle rituals selected by the creator (for Ocultista)
        // payload.selected_ritual_ids -> array of ritual catalog ids
        const ritualIds = Array.isArray(payload.selected_ritual_ids) ? payload.selected_ritual_ids.map(Number) : [];
        if (ritualIds.length > 0) {
          // load character attributes to compute defaults for rituals
          AttributeModel.findByCharacterId(id, (errA, attrsRes) => {
            const attrs = (attrsRes && attrsRes.length) ? attrsRes[0] : {};
            const limiteGasto = Number(character.limite_gasto_pe || attrs.limite_gasto_pe || attrs.intelecto || 0);
            const presenca = Number(attrs.presenca || 0);
            const dt_resistencia_default = 10 + limiteGasto + presenca;
            const limite_rituais_default = Number(attrs.intelecto || 1);

            const addRitualNext = (i) => {
              if (i >= ritualIds.length) return; // done
              const rid = ritualIds[i];
              // fetch ritual catalog to get circle
              RitualModel.findById(rid, (errR, ritualRow) => {
                const circle = (ritualRow && ritualRow.circle) ? ritualRow.circle : null;
                CharacterRitualModel.addFromCatalog(id, rid, { dt_resistencia: dt_resistencia_default, circulo: circle, limite_rituais: limite_rituais_default }, (errCR) => {
                  if (errCR) console.warn('Erro ao adicionar ritual selecionado:', errCR && errCR.message);
                  addRitualNext(i+1);
                });
              });
            };

            addRitualNext(0);
          });
        }
      });
  });
};

module.exports = CharacterController;

// update basic character details (profile/config)
CharacterController.updateDetails = (req, res) => {
  const { id } = req.params;
  const user = req.user || {};
  const userId = user.id;
  const payload = req.body || {};

  const CharacterModel = require('../models/characterModel');
  const ClassModel = require('../models/classModel');
  const TrailModel = require('../models/trailModel');
  const OriginModel = require('../models/originModel');

  CharacterModel.findById(id, (err, character) => {
    if (err) return res.status(500).json(err);
    if (!character) return res.status(404).json({ message: 'Personagem não encontrado' });
  // owners can update their own character; additionally allow 'master' and 'admin' roles
  if (character.user_id !== userId && !(user && (user.role === 'master' || user.role === 'admin'))) return res.status(403).json({ message: 'Acesso negado' });

    // merge provided payload with existing character to avoid setting NOT NULL fields to null
    const mergedPayload = {
      name: payload.name !== undefined ? payload.name : character.name,
      idade: payload.idade !== undefined ? payload.idade : character.idade,
      origem: payload.origem !== undefined ? payload.origem : character.origem,
      origem_id: payload.origem_id !== undefined ? payload.origem_id : character.origem_id,
      classe: payload.classe !== undefined ? payload.classe : character.classe,
      classe_id: payload.classe_id !== undefined ? payload.classe_id : character.classe_id,
      trilha: payload.trilha !== undefined ? payload.trilha : character.trilha,
      trilha_id: payload.trilha_id !== undefined ? payload.trilha_id : character.trilha_id,
      nivel: payload.nivel !== undefined ? payload.nivel : character.nivel,
      nex: payload.nex !== undefined ? payload.nex : character.nex,
      prestigio: payload.prestigio !== undefined ? payload.prestigio : character.prestigio,
      afinidade: payload.afinidade !== undefined ? payload.afinidade : character.afinidade,
      imagem_perfil: payload.imagem_perfil !== undefined ? payload.imagem_perfil : character.imagem_perfil,
      imagem_token: payload.imagem_token !== undefined ? payload.imagem_token : character.imagem_token,
      status_formula: payload.status_formula !== undefined ? payload.status_formula : character.status_formula,
      defense_formula: payload.defense_formula !== undefined ? payload.defense_formula : character.defense_formula
    };

    // validate template ids if provided
    const validateAndUpdate = () => {
      CharacterModel.updateDetails(id, mergedPayload, (err2, result) => {
        if (err2) return res.status(500).json(err2);
        // after updating details, recalculate max stats based on new class/level/formula
        const CharacterService = require('../services/characterService');
        CharacterService.recalculateStatusMax(id, (err3, stats) => {
          if (err3) {
            // log error but still return success for details update
            console.warn('Erro ao recalcular status:', err3 && err3.message ? err3.message : err3);
            return res.json({ message: 'Detalhes atualizados' });
          }
          // return updated fields back to client including computed max stats
          res.json({ message: 'Detalhes atualizados', computed: stats });
        });
      });
    };

    if (payload.classe_id) {
      ClassModel.findById(payload.classe_id, (err3, cls) => {
        if (err3) return res.status(500).json(err3);
        if (!cls) return res.status(400).json({ message: 'Classe inválida' });

        if (payload.trilha_id) {
          TrailModel.findByClassId(payload.classe_id, (err4, trails) => {
            if (err4) return res.status(500).json(err4);
            const found = (trails || []).some(t => t.id === Number(payload.trilha_id));
            if (!found) return res.status(400).json({ message: 'Trilha não pertence à classe selecionada' });
            // origem can be validated separately
            if (payload.origem_id) {
              OriginModel.findById(payload.origem_id, (err5, org) => {
                if (err5) return res.status(500).json(err5);
                if (!org) return res.status(400).json({ message: 'Origem inválida' });
                validateAndUpdate();
              });
            } else validateAndUpdate();
          });
        } else {
          if (payload.origem_id) {
            OriginModel.findById(payload.origem_id, (err6, org) => {
              if (err6) return res.status(500).json(err6);
              if (!org) return res.status(400).json({ message: 'Origem inválida' });
              validateAndUpdate();
            });
          } else validateAndUpdate();
        }
      });
    } else if (payload.trilha_id) {
      // trilha provided but no classe: verify trail exists
      TrailModel.findByClassId(payload.trilha_id, (err7, trails) => {
        // trail validation fallback: if trail doesn't exist by id, return error
        // simpler: attempt to find trail by id in trails table
        const sqlCheck = require('../models/trailModel');
        sqlCheck.findAll((err8, allTrails) => {
          if (err8) return res.status(500).json(err8);
          const found = (allTrails || []).some(t => t.id === Number(payload.trilha_id));
          if (!found) return res.status(400).json({ message: 'Trilha inválida' });
          if (payload.origem_id) {
            OriginModel.findById(payload.origem_id, (err9, org) => {
              if (err9) return res.status(500).json(err9);
              if (!org) return res.status(400).json({ message: 'Origem inválida' });
              validateAndUpdate();
            });
          } else validateAndUpdate();
        });
      });
    } else if (payload.origem_id) {
      OriginModel.findById(payload.origem_id, (err10, org) => {
        if (err10) return res.status(500).json(err10);
        if (!org) return res.status(400).json({ message: 'Origem inválida' });
        validateAndUpdate();
      });
    } else {
      validateAndUpdate();
    }
  });
};