import express from 'express';
import multer from 'multer';
import path from 'path';
import { processPlan, exportExcelPlan } from '../controllers/planController.js';


const router = express.Router();

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'));
    }
  }
});

router.post('/upload', upload.single('file'), processPlan);
router.post('/export-excel', upload.single('file'), exportExcelPlan);

export default router;