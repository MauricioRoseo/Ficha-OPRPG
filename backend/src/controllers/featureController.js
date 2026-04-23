const FeatureService = require('../services/featureService');

const FeatureController = {

  create: (req, res) => {
    FeatureService.createFeature(req.body, (err, result) => {
      if (err) return res.status(500).json(err);

      res.status(201).json({
        message: 'Feature criada!',
        id: result.insertId
      });
    });
  },

  findAll: (req, res) => {
    FeatureService.getAllFeatures((err, results) => {
      if (err) return res.status(500).json(err);

      res.json(results);
    });
  },

  update: (req, res) => {
    const id = req.params.id;
    const payload = req.body || {};
    FeatureService.updateFeature(id, payload, (err, result) => {
      if (err) return res.status(500).json({ message: err.message || 'Erro ao atualizar feature' });
      res.json({ message: 'Feature atualizada' });
    });
  },

  remove: (req, res) => {
    const id = req.params.id;
    FeatureService.removeFeature(id, (err, result) => {
      if (err) return res.status(500).json({ message: err.message || 'Erro ao remover feature' });
      res.json({ message: 'Feature removida' });
    });
  },

  search: (req, res) => {
    const q = req.query.q || '';
    const type = req.query.type || null;

    FeatureService.getAllFeatures((err, results) => {
      if (err) return res.status(500).json(err);

      let filtered = results || [];
      if (type) filtered = filtered.filter(f => f.type === type);
      if (q) filtered = filtered.filter(f => (f.name || '').toLowerCase().includes(q.toLowerCase()));

      res.json(filtered);
    });
  },

  addToCharacter: (req, res) => {
    const { characterId, featureId } = req.params;

    FeatureService.addFeatureToCharacter(
      characterId,
      featureId,
      req.body,
      (err) => {
        if (err) return res.status(500).json(err);

        res.json({ message: 'Feature adicionada ao personagem!' });
      }
    );
  },

  getByCharacter: (req, res) => {
    const { characterId } = req.params;

    FeatureService.getCharacterFeaturesGrouped(characterId, (err, results) => {
      if (err) return res.status(500).json(err);

      res.json(results);
    });
  }

  ,

  removeFromCharacter: (req, res) => {
    const { characterId, id } = req.params;
    const userId = req.user && req.user.id;

    FeatureService.removeFeatureFromCharacter(characterId, id, userId, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'Erro' });
      }
      res.json({ message: 'Perícia removida' });
    });
  }

  ,

  updateCharacterFeature: (req, res) => {
    const { characterId, id } = req.params;
    const userId = req.user && req.user.id;
    const payload = req.body || {};

    FeatureService.updateCharacterFeature(characterId, id, payload, userId, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'Erro' });
      }
      res.json({ message: 'Perícia atualizada' });
    });
  }

};

module.exports = FeatureController;