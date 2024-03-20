require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
let bodyParser = require("body-parser");
const shortid = require('shortid');
const dns = require('dns');
const options = {
  family: 0,
  hints: dns.ADDRCONFIG | dns.V4MAPPED,
};


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
  try {
  console.log(req.body)
  console.log("enter try");
  const hostname = new URL(req.body.url).hostname;
  console.log(hostname);
  dns.lookup(hostname,  options, async (err, address, family) => {
    if (err) {
      res.json({"error": "invalid url"});
    } else {
      const shortURL = await URLModel.create({ original_url: `https://${hostname}` });
      console.log("shorturl generated");
      res.json({original_url: shortURL.original_url, short_url: shortURL.short_url});
    }
  });
  } catch {
    console.log("enter catch");
    res.json({"error": "invalid url"});
  }
});


app.get('/api/shorturl/:short', async (req, res) => {
  const { short } = req.params;
  try {
    const url = await URLModel.findOne({ short_url: short });
    if (url) {
      res.redirect(`${url.original_url}`);
    } else {
      res.json({ error: 'invalid url' });
    }
  } catch (err) {
    console.error(err);
    res.json({ error: 'Server error' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
