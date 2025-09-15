import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// POST /draw-boxes
app.post('/draw-boxes', upload.single('image'), (req, res) => {
  const coords = JSON.parse(req.body.coordinates); // Expect array of {x1,y1,x2,y2}
  const inputPath = req.file.path;
  const outputPath = path.join(__dirname, 'output.jpg');

  // Build draw commands
  const drawCmds = coords
    .map(c => `-draw "rectangle ${c.x1},${c.y1} ${c.x2},${c.y2}"`)
    .join(' ');

  const cmd = `magick ${inputPath} -stroke red -strokewidth 3 -fill none ${drawCmds} ${outputPath}`;

  exec(cmd, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error processing image');
    }
    res.sendFile(outputPath, () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ImageMagick API running on port ${PORT}`));