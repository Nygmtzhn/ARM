import pool from '../db.js';

export const getAllDishes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        dishes.*, 
        categories.name AS category_name, 
        categories.slug AS category_slug,
        categories.position,
        menus.name AS menu_name,
        menus.slug AS menu_slug
      FROM dishes
      LEFT JOIN categories ON dishes.category_id = categories.id
      LEFT JOIN menus ON dishes.menu_id = menus.id
      ORDER BY categories.position, dishes.id DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDish = async (req, res) => {
  try {
    const { name, description, price, category_id, menu_id } = req.body;

    const image = req.files?.image?.[0]?.filename;
    const model = req.files?.model?.[0]?.filename;
    const usdz = req.files?.usdz?.[0]?.filename;

    const imageUrl = image ? `/uploads/${image}` : null;
    const modelUrl = model ? `/uploads/${model}` : null;
    const modelUrlUsdz = usdz ? `/uploads/${usdz}` : null;

    const query = `
      INSERT INTO dishes (
        name, description, price,
        image_url, model_url, model_url_usdz,
        category_id, menu_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      name,
      description,
      price,
      imageUrl,
      modelUrl,
      modelUrlUsdz,
      category_id,
      menu_id
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to create dish' });
  }
};

export const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category_id, menu_id } = req.body;

    const image = req.files?.image?.[0]?.filename;
    const model = req.files?.model?.[0]?.filename;
    const usdz = req.files?.usdz?.[0]?.filename;

    const fields = [];
    const values = [];
    let i = 1;

    const pushField = (label, val) => {
      if (val !== undefined) {
        fields.push(`${label} = $${i++}`);
        values.push(val);
      }
    };

    pushField('name', name);
    pushField('description', description);
    pushField('price', price);
    pushField('category_id', category_id);
    pushField('menu_id', menu_id);
    pushField('image_url', image ? `/uploads/${image}` : undefined);
    pushField('model_url', model ? `/uploads/${model}` : undefined);
    pushField('model_url_usdz', usdz ? `/uploads/${usdz}` : undefined);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE dishes SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to update dish' });
  }
};

export const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM dishes WHERE id = $1', [id]);
    res.status(204).end();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to delete dish' });
  }
};
