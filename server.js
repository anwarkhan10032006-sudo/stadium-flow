const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve all static files from the root directory
app.use(express.static(__dirname));

// Fallback route: all unmatched requests return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// The server MUST listen on process.env.PORT and MUST bind to "0.0.0.0"
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
