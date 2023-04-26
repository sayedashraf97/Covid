const express = require('express');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const app = express();
const port = 8080;
const mongoURI = 'mongodb://localhost:27017/covidtally';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error(err));

const tallySchema = new Schema({
  state: String,
  infected: Number,
  recovered: Number,
  death: Number,
});

const Tally = mongoose.model('Tally', tallySchema);
app.get('/totalRecovered', async (req, res) => {
    const result = await Tally.aggregate([
      { $group: { _id: 'total', recovered: { $sum: '$recovered' } } },
    ]);
    res.json({ data: result[0] });
  });
  
  app.get('/totalActive', async (req, res) => {
    const result = await Tally.aggregate([
      {
        $group: {
          _id: 'total',
          active: {
            $sum: { $subtract: ['$infected', '$recovered'] },
          },
        },
      },
    ]);
    res.json({ data: result[0] });
  });
  
  app.get('/totalDeath', async (req, res) => {
    const result = await Tally.aggregate([
      { $group: { _id: 'total', death: { $sum: '$death' } } },
    ]);
    res.json({ data: result[0] });
  });
  
  app.get('/hotspotStates', async (req, res) => {
    const result = await Tally.aggregate([
      {
        $addFields: {
          rate: {
            $round: [
              {
                $divide: [
                  { $subtract: ['$infected', '$recovered'] },
                  '$infected',
                ],
              },
              5,
            ],
          },
        },
      },
      {
        $match: {
          rate: { $gt: 0.1 },
        },
      },
      {
        $project: {
          _id: 0,
          state: 1,
          rate: 1,
        },
      },
    ]);
    res.json({ data: result });
  });
  
  app.get('/healthyStates', async (req, res) => {
    const result = await Tally.aggregate([
      {
        $addFields: {
          mortality: {
            $round: [{ $divide: ['$death', '$infected'] }, 5],
          },
        },
      },
      {
        $match: {
          mortality: { $lt: 0.005 },
        },
      },
      {
        $project: {
          _id: 0,
          state: 1,
          mortality: 1,
        },
      },
    ]);
    res.json({ data: result });
  });
  app.listen(port, () => console.log(`Server running on port ${port}`));
  