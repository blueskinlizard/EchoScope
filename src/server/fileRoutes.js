const express = require('express')
const router = express.Router()
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.post('/uploadSound', upload.single('file'), (req, res) => {
    console.log(req.file);
    res.json({ message: 'File uploaded successfully', file: req.file });
});


module.exports = router; 