const LayoutService = require('../services/layoutService');

const LayoutController = {
  create: (req, res) => {
    const data = req.body || {};
    data.created_by = req.user.id;
    LayoutService.createLayout(data, (err, result) => {
      if (err) return res.status(500).json({ message: err.message || 'Erro' });
      res.status(201).json({ message: 'Layout criado', id: result.insertId });
    });
  },

  update: (req, res) => {
    const { id } = req.params;
    const data = req.body || {};
    const user = req.user || null;

    LayoutService.updateLayout(id, data, user, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'Erro' });
      }
      res.json({ message: 'Layout atualizado' });
    });
  },

  delete: (req, res) => {
    const { id } = req.params;
    const user = req.user || null;
    LayoutService.deleteLayout(id, user, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'Erro' });
      }
      res.json({ message: 'Layout removido' });
    });
  },

  addCharacter: (req, res) => {
    const { id } = req.params; // layout id
    const { character_id } = req.body || {};
    const user = req.user || null;

    LayoutService.addCharacterToLayout(id, character_id, user, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'Erro' });
      }
      res.json({ message: 'Personagem adicionado ao layout' });
    });
  },

  removeCharacter: (req, res) => {
    const { id, charId } = req.params; // layout id, character id
    const user = req.user || null;

    LayoutService.removeCharacterFromLayout(id, charId, user, (err, result) => {
      if (err) {
        if (err.message === 'Acesso negado') return res.status(403).json({ message: err.message });
        return res.status(500).json({ message: err.message || 'Erro' });
      }
      res.json({ message: 'Personagem removido do layout' });
    });
  },

  getBySlug: (req, res) => {
    const { slug } = req.params;
    LayoutService.getLayoutWithCharacters(slug, (err, result) => {
      if (err) return res.status(404).json({ message: err.message || 'Não encontrado' });
      // public view only if layout is_public
      if (!result.layout || !result.layout.is_public) return res.status(404).json({ message: 'Não encontrado' });
      res.json(result);
    });
  },

  getById: (req, res) => {
    const { id } = req.params;
    const user = req.user || {};

    LayoutService.getLayoutWithCharacters(Number(id), (err, result) => {
      if (err) return res.status(404).json({ message: err.message || 'Não encontrado' });
      // only owner or elevated roles can fetch via this endpoint
      if (result.layout.created_by !== (user && user.id) && !(user && (user.role === 'master' || user.role === 'admin'))) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      res.json(result);
    });
  },

  getByCreator: (req, res) => {
    const user = req.user || {};
    LayoutService.getByCreator(user.id, (err, results) => {
      if (err) return res.status(500).json({ message: err.message || 'Erro' });
      res.json(results || []);
    });
  }
};

module.exports = LayoutController;
