const express = require('express');
const cors = require('cors');

require('./config/database');

const app = express();
const characterRoutes = require('./routes/characterRoutes');
const attributeRoutes = require('./routes/attributeRoutes');
const featureRoutes = require('./routes/featureRoutes');
const authRoutes = require('./routes/authRoutes');
const protectionRoutes = require('./routes/protectionRoutes');
const resistanceRoutes = require('./routes/resistanceRoutes');
const tabRoutes = require('./routes/tabRoutes');
const attackRoutes = require('./routes/attackRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const ritualRoutes = require('./routes/ritualRoutes');
const characterRitualRoutes = require('./routes/characterRitualRoutes');
const templateRoutes = require('./routes/templateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const layoutRoutes = require('./routes/layoutRoutes');

app.use(cors());
app.use(express.json());
app.use('/characters', characterRoutes);
app.use('/attributes', attributeRoutes);
app.use('/features', featureRoutes);
app.use('/auth', authRoutes);
app.use('/protections', protectionRoutes);
app.use('/resistances', resistanceRoutes);
app.use('/', tabRoutes);
app.use('/', attackRoutes);
app.use('/', inventoryRoutes);
app.use('/', itemsRoutes);
app.use('/rituals', ritualRoutes);
app.use('/', characterRitualRoutes);
app.use('/templates', templateRoutes);
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/layouts', layoutRoutes);

app.get('/', (req, res) => {
  res.send('API Ficha OPRPG funcionando 🚀');
});

module.exports = app;