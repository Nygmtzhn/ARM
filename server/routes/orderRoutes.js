// server/routes/orderRoutes.js
import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,       // Optional
  updateOrderStatus   // Optional
} from '../controllers/orderController.js';
// import { protectAdmin } from '../middleware/authMiddleware'; // Optional: Middleware to protect admin routes

const router = express.Router();
router.put('/:id/status', updateOrderStatus);
router.post('/', createOrder); // Customer places an order
router.get('/', getAllOrders); // Admin gets all orders (add protectAdmin middleware if implemented)
// router.get('/:id', getOrderById); // Optional
// router.put('/:id/status', updateOrderStatus); // Optional: Admin updates order status

export default router;
