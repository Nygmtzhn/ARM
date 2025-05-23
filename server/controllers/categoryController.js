// server/controllers/categoryController.js
import pool from '../db.js';

// Get categories, optionally filtered by menu_id
export const getCategories = async (req, res) => {
  const menu_id = parseInt(req.query.menu_id);
  try {
    let result;
    if (menu_id) {
      result = await pool.query(
        'SELECT * FROM categories WHERE menu_id = $1 ORDER BY position ASC, name ASC',
        [menu_id]
      );
    } else {
      // If no menu_id, perhaps fetch all categories or categories for a default menu
      // For admin purposes, fetching all might be useful, or make menu_id mandatory for management.
      // For now, let's keep the existing behavior which also allows fetching all if no menu_id.
      result = await pool.query('SELECT c.*, m.name as menu_name FROM categories c JOIN menus m ON c.menu_id = m.id ORDER BY m.id, c.position ASC, c.name ASC');
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  const { name, slug, position, menu_id } = req.body;
  if (!name || !slug || !menu_id) {
    return res.status(400).json({ error: 'Name, slug, and menu_id are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, slug, position, menu_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, position || 0, menu_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating category:', err.message);
    if (err.code === '23505') { // unique_violation for (menu_id, slug)
        return res.status(400).json({ error: 'Slug already exists for this menu.' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Update an existing category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, position, menu_id } = req.body;
  if (!name || !slug || !menu_id) {
    return res.status(400).json({ error: 'Name, slug, and menu_id are required' });
  }
  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1, slug = $2, position = $3, menu_id = $4 WHERE id = $5 RETURNING *',
      [name, slug, position || 0, menu_id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating category:', err.message);
    if (err.code === '23505') {
        return res.status(400).json({ error: 'Slug already exists for this menu.' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Check if any dishes are associated with this category
    const dishCheck = await pool.query('SELECT id FROM dishes WHERE category_id = $1 LIMIT 1', [id]);
    if (dishCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category. It is associated with existing dishes. Please reassign or delete those dishes first.' });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' }); // Send 200 with message or 204
  } catch (err) {
    console.error('Error deleting category:', err.message);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};