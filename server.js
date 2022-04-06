const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;
const jwt = require('jsonwebtoken');
const fs = require('fs');

// const knexCommands = require('./database/knex-commands');
const knexCreateTables = require('./database/knex-create-tables');

//IMPORTANT: Change to .env
const superSecretKey='testKeyChangeLater';



// multer setup --begin
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{

        // create the destination path if it does not already exist
        const path = `assets/${req.decode.userid}`;
        if (!fs.existsSync(path)){
          fs.mkdirSync(path);
        
      }
        cb(null, path);
    },
    filename: (req, file, cb) => {
        if (!req.thumbnails) req.thumbnails = [];
        req.thumbnails.push(file.originalname);
        cb(null, file.originalname)
    }
})
// const upload = multer({storage: storage});
const upload = multer({
  storage: storage
});

//multer setup --end


knexCreateTables.createTables();

app.use(express.static('public'));
app.use(express.json()); // IMPORTANT: Remember to use this to allow POST and PUT requests. You can specify route as first parameter.
app.use(cors());

app.use((req, res, next) => {
  
  if (req.url === "/signup" || req.url === "/login" || req.url.startsWith("/asset/") || req.url === "/authenticate") {
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

// app.use('/assets', upload.any('image'));

app.use('/assets', upload.any('image'));

const routes = require('./routes/routes');
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});