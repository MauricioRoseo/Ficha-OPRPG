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
    if (!classId) return res.status(400).json({ message: 'classId required' });
    TrailModel.findByClassId(classId, (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  },

  getOrigins: (req, res) => {
    OriginModel.findAll((err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results || []);
    });
  }
};

module.exports = TemplateController;
