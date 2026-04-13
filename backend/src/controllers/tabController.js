const TabService = require('../services/tabService');

const TabController = {
  getByCharacter: (req, res) => {
    const { characterId } = req.params;
    TabService.ensureDefaultTabs(characterId, (err, tabs) => {
      if (err) return res.status(500).json(err);
      res.json(tabs || []);
    });
  }
};

module.exports = TabController;
