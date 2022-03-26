const express = require('express');
const app = express();
const PORT = 8080;

// const knexCommands = require('./database/knex-commands');

// knexCommands.createTables();

app.use(express.static('public'));
app.use(express.json()); // IMPORTANT: Remember to use this to allow POST and PUT requests. You can specify route as first parameter.
app.use(cors());

const routes = require('./routes/routes');
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});