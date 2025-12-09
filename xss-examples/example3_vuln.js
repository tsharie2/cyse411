const express = require('express');
const path = require('path');

const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Safe route using res.render()
app.get('/search', (req, res) => {
  const q = req.query.q || '';
  res.render('search', { query: q });
});

module.exports = app;
