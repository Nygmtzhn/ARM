// server/routes/categoryRoutes.js
import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';
// import { protectAdmin } from '../middleware/authMiddleware'; // Optional: for protecting routes

const router = express.Router();

router.get('/', getCategories);
router.post('/', createCategory);       // Add protectAdmin if implemented
router.put('/:id', updateCategory);    // Add protectAdmin if implemented
router.delete('/:id', deleteCategory); // Add protectAdmin if implemented

export default router;