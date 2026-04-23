const ClassModel = require('../models/classModel');
const TrailModel = require('../models/trailModel');
const OriginModel = require('../models/originModel');

const TemplateController = {
  getClasses: (req, res) => {
    ClassModel.findAll((err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  },

  getTrailsByClass: (req, res) => {
    const classId = req.query.classId || req.params.classId;
    if (!classId) {
      // return all trails when no classId provided
      TrailModel.findAll((err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results || []);
      });
      return;
    }
    TrailModel.findByClassId(classId, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  },

  createTrail: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const payload = req.body || {};
    // coerce ability fields to null when absent
    ['ability_lvl_2_id','ability_lvl_8_id','ability_lvl_13_id','ability_lvl_20_id'].forEach(k => { if (payload[k] === '') payload[k] = null; });
    TrailModel.create(payload, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: 'Trilha criada', id: result.insertId });
    });
  },

  updateTrail: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    const payload = req.body || {};
    ['ability_lvl_2_id','ability_lvl_8_id','ability_lvl_13_id','ability_lvl_20_id'].forEach(k => { if (payload[k] === '') payload[k] = null; });
    TrailModel.update(id, payload, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Trilha atualizada' });
    });
  },

  deleteTrail: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    TrailModel.remove(id, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Trilha removida' });
    });
  },

  getOrigins: (req, res) => {
    OriginModel.findAll((err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  }
  ,

  createOrigin: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const payload = req.body || {};
    OriginModel.create(payload, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: 'Origem criada', id: result.insertId });
    });
  },

  updateOrigin: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    const payload = req.body || {};
    OriginModel.update(id, payload, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Origem atualizada' });
    });
  },

  deleteOrigin: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    OriginModel.remove(id, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Origem removida' });
    });
  }
  ,

  createClass: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const payload = req.body || {};
    // attempt to parse proficiencies/metadata if provided as strings
    try{
      if (typeof payload.proficiencies === 'string') payload.proficiencies = JSON.parse(payload.proficiencies);
    }catch(e){ /* keep as string */ }
    try{
      if (typeof payload.metadata === 'string') payload.metadata = JSON.parse(payload.metadata);
    }catch(e){ /* keep as string */ }
    ClassModel.create(payload, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.status(201).json({ message: 'Classe criada', id: result.insertId });
    });
  },

  updateClass: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    const payload = req.body || {};
    try{
      if (typeof payload.proficiencies === 'string') payload.proficiencies = JSON.parse(payload.proficiencies);
    }catch(e){ }
    try{
      if (typeof payload.metadata === 'string') payload.metadata = JSON.parse(payload.metadata);
    }catch(e){ }
    ClassModel.update(id, payload, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Classe atualizada' });
    });
  },

  deleteClass: (req, res) => {
    const role = req.user && req.user.role;
    if (!(role === 'master' || role === 'admin')) return res.status(403).json({ message: 'Acesso negado' });
    const id = req.params.id;
    ClassModel.remove(id, (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Classe removida' });
    });
  }
};

module.exports = TemplateController;
