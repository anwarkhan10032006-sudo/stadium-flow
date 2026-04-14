const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 8080;

// 1. Security: Set robust HTTP headers, enabling Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://cdnjs.cloudflare.com", "https://www.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "https://*.firebaseio.com", "https://www.google-analytics.com", "wss://*.firebaseio.com"],
        imgSrc: ["'self'", "data:", "https://www.google-analytics.com"]
      },
    },
  })
);

// 2. Efficiency: Compress HTTP responses for faster load times
app.use(compression());

// 3. Security: Enable Cross-Origin Resource Sharing
app.use(cors());

// 4. Security: Rate limiting to prevent brute-force/DDoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: 'Too many requests from this IP, please try again later.',
});
app.use(apiLimiter);

// Serve all static files from the root directory
app.use(express.static(__dirname));

// Fallback route: all unmatched requests return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// The server MUST listen on process.env.PORT and MUST bind to "0.0.0.0"
// Only start listening if this file is run directly (allows testing)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

// Export the app for testing
module.exports = app;
