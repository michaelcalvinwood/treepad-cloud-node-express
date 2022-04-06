const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const superSecretKey=process.env.SUPERSECRETKEY;

// multer is used to write uploaded files to the assets/:userId directory
// multer setup --begin
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) =>{

        // create the destination path if it does not already exist
        let path='assets/';
        if (!fs.existsSync(path)){
          fs.mkdirSync(path);
        }
        path = `assets/${req.decode.userid}`;
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
const upload = multer({
  storage: storage
});

//multer setup --end

app.use(express.static('public'));
app.use(express.json()); 
app.use(cors());

app.use((req, res, next) => {
  
  if (req.url === "/signup" || req.url === "/login" || req.url.startsWith("/asset/") || req.url === "/authenticate" || req.url.startsWith('/initialize')) {
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

app.use('/assets', upload.any('image'));

const routes = require('./routes/routes');
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});