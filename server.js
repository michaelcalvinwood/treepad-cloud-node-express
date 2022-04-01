const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

// const knexCommands = require('./database/knex-commands');
const knexCreateTables = require('./database/knex-create-tables');

knexCreateTables.createTables();

app.use(express.static('public'));
app.use(express.json()); // IMPORTANT: Remember to use this to allow POST and PUT requests. You can specify route as first parameter.
app.use(cors());

const routes = require('./routes/routes');
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});