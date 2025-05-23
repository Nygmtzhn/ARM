import pool from '../db.js';

export const getCategories = async (req, res) => {
  const menu_id = parseInt(req.query.menu_id);


  try {
    let result;

    if (menu_id) {
      result = await pool.query(
        'SELECT * FROM categories WHERE menu_id = $1 ORDER BY position ASC',
        [menu_id]
      );
    } else {
      result = await pool.query('SELECT * FROM categories ORDER BY position ASC');
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
