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

};

module.exports = FeatureController;