// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BASE_DIR = path.resolve(__dirname, 'files');
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR, { recursive: true });

/**
 * Safely resolves a user-supplied path relative to a base directory.
 * Ensures the returned path is nested inside BASE_DIR.
 */
function resolveSafe(baseDir, userInput) {
  try {
    userInput = decodeURIComponent(userInput);
  } catch (e) {}

  // Normalize and resolve path
  const resolved = path.resolve(baseDir, userInput);

  // Prevent path traversal by verifying the prefix
  if (!resolved.startsWith(baseDir + path.sep)) {
    return null;
  }

  return resolved;
}

/**
 * -----------------------
 * SECURE READ ENDPOINT
 * -----------------------
 */
app.post(
  '/read',
  body('filename')
    .exists().withMessage('filename required')
    .isString()
    .trim()
    .notEmpty().withMessage('filename must not be empty')
    .custom(value => {
      if (value.includes('\0')) throw new Error('null byte not allowed');
      return true;
    }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const filename = req.body.filename;
    const safePath = resolveSafe(BASE_DIR, filename);

    if (!safePath) {
      return res.status(403).json({ error: 'Path traversal detected' });
    }

    if (!fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(safePath, 'utf8');
    res.json({ path: safePath, content });
  }
);

/**
 * -----------------------
 * FIXED VERSION OF VULNERABLE ROUTE
 * (replaces /read-no-validate)
 * -----------------------
 */
app.post('/read-no-validate', (req, res) => {
  const filename = req.body.filename || '';

  const safePath = resolveSafe(BASE_DIR, filename);
  if (!safePath) {
    return res.status(403).json({ error: 'Path traversal detected' });
  }

  if (!fs.existsSync(safePath)) {
    return res.status(404).json({ error: 'File not found', path: safePath });
  }

  const content = fs.readFileSync(safePath, 'utf8');
  res.json({ path: safePath, content });
});

/**
 * -----------------------
 * SAMPLE FILE SETUP
 * -----------------------
 */
app.post('/setup-sample', (req, res) => {
  const samples = {
    'hello.txt': 'Hello from safe file!\n',
    'notes/readme.md': '# Readme\nSample readme file'
  };

  Object.entries(samples).forEach(([relativePath, fileContent]) => {
    const filePath = path.resolve(BASE_DIR, relativePath);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, fileContent, 'utf8');
  });

  res.json({ ok: true, base: BASE_DIR });
});

/**
 * Only listen when run directly
 */
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

module.exports = app;
