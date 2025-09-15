const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Multer config — only handle the image file now
const upload = multer({ dest: 'uploads/' });

app.post('/draw-boxes', upload.single('image'), (req, res) => {
  try {
    // 1. Validate file
    if (!req.file) {
      return res.status(400).send('No image uploaded');
    }

    // 2. Get uploaded image path
    const imagePath = req.file.path;

    // 3. Parse coordinates from string field
    let coords;
    try {
      coords = JSON.parse(req.body.coordinates);
    } catch (err) {
      fs.unlink(imagePath, () => {});
      return res.status(400).send('Invalid coordinates JSON');
    }

    if (!Array.isArray(coords) || coords.length === 0) {
      fs.unlink(imagePath, () => {});
      return res.status(400).send('Coordinates must be a non-empty array');
    }

    // 4. Build ImageMagick draw commands
    const drawArgs = coords
      .map(c => `rectangle ${c.x1},${c.y1} ${c.x2},${c.y2}`)
      .join(' ');

    // 5. Define output path
    const outputPath = path.join(__dirname, 'output.jpg');

    // 6. Run ImageMagick
    const cmd = `magick ${imagePath} -stroke red -strokewidth 3 -fill none -draw "${drawArgs}" ${outputPath}`;
    exec(cmd, (err) => {
      fs.unlink(imagePath, () => {}); // cleanup upload

      if (err) {
        console.error('ImageMagick error:', err);
        return res.status(500).send('Image processing failed');
      }

      res.sendFile(outputPath, (err) => {
        if (!err) {
          fs.unlink(outputPath, () => {}); // cleanup output
        }
      });
    });
  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).send('Server error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ImageMagick API running on port ${PORT}`);
});