import pool from '../db.js';


export const createOrder = async (req, res) => {
  const { cart, orderDetails, total } = req.body;

  if (!cart || !orderDetails || total === undefined) {
    return res.status(400).json({ error: 'Missing order data' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO orders (customer_details, order_items, total_amount, order_status) VALUES ($1, $2, $3, $4) RETURNING *',
      [orderDetails, JSON.stringify(cart), total, 'new']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating order:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
};


export const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'Missing order status' });
    }
    const result = await pool.query(
      'UPDATE orders SET order_status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating order status:', err.message); 
    res.status(500).json({ error: 'Failed to update order status' });
  }
};