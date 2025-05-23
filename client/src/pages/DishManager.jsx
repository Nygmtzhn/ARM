import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DishManager = () => {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);

  const [form, setForm] = useState({
    menu_id: '',
    category_id: '',
    name: '',
    description: '',
    price: '',
    image: null,
    model: null,
    usdz: null,
  });

  const [editingId, setEditingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    fetchMenus();
    fetchDishes();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = '/login';
  }, []);


  useEffect(() => {
    filterDishes();
  }, [dishes, form.menu_id, form.category_id]);

  const fetchMenus = async () => {
    const res = await axios.get('/api/menus');
    setMenus(res.data);
  };

  const fetchCategories = async (menuId) => {
    const res = await axios.get(`/api/categories?menu_id=${menuId}`);
    setCategories(res.data);
  };

  const fetchDishes = async () => {
    const res = await axios.get('/api/dishes');
    setDishes(res.data);
  };

  const filterDishes = () => {
    let filtered = [...dishes];
    if (form.menu_id) {
      filtered = filtered.filter(d => String(d.menu_id) === String(form.menu_id));
    }
    if (form.category_id) {
      filtered = filtered.filter(d => String(d.category_id) === String(form.category_id));
    }
    setFilteredDishes(filtered);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const updatedValue = files ? files[0] : value;

    setForm(prev => {
      const updatedForm = {
        ...prev,
        [name]: updatedValue,
      };

      if (name === 'menu_id') {
        fetchCategories(value);
        updatedForm.category_id = '';
      }

      return updatedForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    for (let key in form) {
      formData.append(key, form[key]);
    }

    if (editingId) {
      await axios.put(`/api/dishes/${editingId}`, formData);
      console.log('Dish updated:', editingId);
    } else {
      await axios.post('/api/dishes', formData);
      console.log('Dish created');
    }

    resetForm();
    fetchDishes();
  };

  const resetForm = () => {
    setForm({
      menu_id: '',
      category_id: '',
      name: '',
      description: '',
      price: '',
      image: null,
      model: null,
      usdz: null,
    });
    setEditingId(null);
  };

  const handleEdit = (dish) => {
    console.log('Editing dish:', dish);
    setForm({
      menu_id: dish.menu_id,
      category_id: dish.category_id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: null,
      model: null,
      usdz: null,
    });
    fetchCategories(dish.menu_id);
    setEditingId(dish.id);
  };

  const handleDelete = async (id) => {
    console.log('Deleting dish ID:', id);
    if (window.confirm('Are you sure you want to delete this dish?')) {
      await axios.delete(`/api/dishes/${id}`);
      fetchDishes();
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Add New Dish</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <select
          name="menu_id"
          onChange={handleChange}
          value={form.menu_id}
          className="w-full p-2 border"
          required
        >
          <option value="">Select Menu</option>
          {menus.map(menu => (
            <option key={menu.id} value={menu.id}>{menu.name}</option>
          ))}
        </select>

        <select
          name="category_id"
          onChange={handleChange}
          value={form.category_id}
          className="w-full p-2 border"
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <input name="name" placeholder="Name" onChange={handleChange} value={form.name} className="w-full p-2 border" required />
        <textarea name="description" placeholder="Description" onChange={handleChange} value={form.description} className="w-full p-2 border" />
        <input name="price" type="number" placeholder="Price" onChange={handleChange} value={form.price} className="w-full p-2 border" required />

        <input name="image" type="file" accept="image/*" onChange={handleChange} className="w-full" />
        <input name="model" type="file" accept=".glb,.gltf" onChange={handleChange} className="w-full" />
        <input name="usdz" type="file" accept=".usdz" onChange={handleChange} className="w-full" />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update' : 'Submit'}
        </button>
      </form>

      <h3 className="text-lg font-bold mt-8 mb-2">Existing Dishes</h3>
      <ul className="space-y-2">
        {filteredDishes.map((dish) => (
          <li
            key={dish.id}
            className="border p-3 rounded relative hover:bg-gray-50"
            onMouseEnter={() => setHoveredId(dish.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p><strong>{dish.name}</strong> — {dish.price}₸</p>
                <p className="text-sm text-gray-500">
                  Menu: {dish.menu_name || '—'}, Category: {dish.category_name || '—'}
                </p>
              </div>
              {hoveredId === dish.id && (
                <div className="flex gap-2 items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(dish);
                    }}
                    className="bg-yellow-400 px-2 py-1 rounded text-sm"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dish.id);
                    }}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DishManager;
