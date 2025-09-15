const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();

// Multer config — store uploads in /uploads
const upload = multer({ dest: 'uploads/' });

// POST /draw-boxes endpoint
app.post(
  '/draw-boxes',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'coordinates', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      // 1. Validate file
      if (!req.files || !req.files.image) {
        return res.status(400).send('No image uploaded');
      }

      // 2. Get uploaded image path
      const imagePath = req.files.image[0].path;

      // 3. Parse coordinates JSON
      let coords;
	try {
 	 const coordsPath = req.files.coordinates[0].path;   // path to uploaded JSON file
 	 const coordsData = fs.readFileSync(coordsPath, 'utf8');
 	 coords = JSON.parse(coordsData);
	  fs.unlink(coordsPath, () => {}); // cleanup JSON file after reading
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

      // 6. Build and run ImageMagick command
      const cmd = `magick ${imagePath} -stroke red -strokewidth 3 -fill none -draw "${drawArgs}" ${outputPath}`;
      exec(cmd, (err) => {
        // Always clean up uploaded file
        fs.unlink(imagePath, () => {});

        if (err) {
          console.error('ImageMagick error:', err);
          return res.status(500).send('Image processing failed');
        }

        // 7. Send processed image
        res.sendFile(outputPath, (err) => {
          if (!err) {
            // Optionally delete output after sending
            fs.unlink(outputPath, () => {});
          }
        });
      });
    } catch (err) {
      console.error('Processing error:', err);
      res.status(500).send('Server error');
    }
  }
);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ImageMagick API running on port ${PORT}`);
});