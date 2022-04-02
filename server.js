const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;
const jwt = require('jsonwebtoken');

// const knexCommands = require('./database/knex-commands');
const knexCreateTables = require('./database/knex-create-tables');

//IMPORTANT: Change to .env
const superSecretKey='testKeyChangeLater';

knexCreateTables.createTables();

app.use(express.static('public'));
app.use(express.json()); // IMPORTANT: Remember to use this to allow POST and PUT requests. You can specify route as first parameter.
app.use(cors());

app.use((req, res, next) => {
  
  if (req.url === "/signup" || req.url === "/login") {
    next();
  } else {
    const token = getToken(req);

    if (token) {
      if (jwt.verify(token, superSecretKey)) {
        // Decode the token to pass along to end-points that may need
        // access to data stored in the token.
        req.decode = jwt.decode(token);
        next();
      } else {
        res.status(403).json({ error: "Not Authorized." });
      }
    } else {
      res.status(403).json({ error: "No token. Unauthorized." });
    }
  }
});

function getToken(req) {
  if (!req.headers.authorization) return false;

  return req.headers.authorization.split(" ")[1];
}


const routes = require('./routes/routes');
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});