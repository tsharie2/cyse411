const escapeHtml = require('escape-html');

app.get('/search', (req, res) => {
  const q = req.query.q || '';
  // Escape any HTML characters to prevent XSS
  const safeQ = escapeHtml(q);
  res.send(`<h1>Results for ${safeQ}</h1>`);
});
