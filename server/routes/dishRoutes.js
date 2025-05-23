import express from 'express';
import multer from 'multer';
import {
  getAllDishes,
  createDish,
  updateDish,
  deleteDish
} from '../controllers/dishController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.get('/', getAllDishes);

router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 },
    { name: 'usdz', maxCount: 1 },
  ]),
  createDish
);

router.put(
  '/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'model', maxCount: 1 },
    { name: 'usdz', maxCount: 1 },
  ]),
  updateDish
);

router.delete('/:id', deleteDish);

export default router;
