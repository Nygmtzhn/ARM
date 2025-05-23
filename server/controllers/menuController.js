// server/controllers/menuController.js
import pool from '../db.js';

export const getAllMenus = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menus ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching menus:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
