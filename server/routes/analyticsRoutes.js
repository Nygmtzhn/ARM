// server/routes/analyticsRoutes.js
import express from 'express';
import {
  getTotalSalesSummary,
  getSalesByDish,
  getSalesByCategory,
  getSalesByMenu,
  downloadSalesReport // Import the new function
} from '../controllers/analyticsController.js';
// import { protectAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// router.use(protectAdmin);

router.get('/summary', getTotalSalesSummary);
router.get('/by-dish', getSalesByDish);
router.get('/by-category', getSalesByCategory);
router.get('/by-menu', getSalesByMenu);
router.get('/sales-report', downloadSalesReport); // New route for report download

export default router;