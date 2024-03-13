require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
let bodyParser = require("body-parser");
const shortid = require('shortid');
const dns = require('dns');



mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB");
});





const shorturl = new mongoose.Schema({
  original_url : {
    type: String,
    required: true,
  },
  short_url: {
    type: String,
    required: true,
    default: shortid.generate
  },
});




const URLModel = mongoose.model("urlshortner", shorturl);

// Basic Configuration
const port = process.env.PORT || 3000;






app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});



// Your first API endpoint
app.post('/api/shorturl', (req, res) => {
  dns.lookup(req.body.url, async (err, address, family) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'invalid url' });
    } else {
      const shortURL = await URLModel.create({ original_url: req.body.url });
      res.json(shortURL);
    }
  });
});


app.get('/api/shorturl/:short', async (req, res) => {
  const { short } = req.params;
  console.log(short)
  try {
    const url = await URLModel.findOne({ short_url: short });
    if (url) {
      res.redirect(url.original_url);
    } else {
      res.status(404).json({ error: 'invalid url' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
