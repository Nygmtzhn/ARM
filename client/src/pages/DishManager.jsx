// src/pages/DishManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DishManager = () => {
  // --- States for Dish Management ---
  const [menus, setMenus] = useState([]);
  const [dishCategories, setDishCategories] = useState([]); // Categories for dish form dropdown
  const [dishes, setDishes] = useState([]);
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [dishForm, setDishForm] = useState({
    menu_id: '',
    category_id: '',
    name: '',
    description: '',
    price: '',
    image: null,
    model: null,
    usdz: null,
  });
  const [editingDishId, setEditingDishId] = useState(null);
  const [hoveredDishId, setHoveredDishId] = useState(null);

  // --- States for Category Management ---
  const [categoryForm, setCategoryForm] = useState({
    id: null, // For editing
    name: '',
    slug: '',
    position: 0,
    menu_id: '', // Menu to which this category belongs
  });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [allCategoriesForDisplay, setAllCategoriesForDisplay] = useState([]); // To list categories for management
  const [categoryManagementMenuFilter, setCategoryManagementMenuFilter] = useState(''); // To filter categories list by menu

  // --- Effects ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    await fetchMenus();
    await fetchDishes();
    await fetchAllCategories(); 
  };

  useEffect(() => {
    filterDishes();
  }, [dishes, dishForm.menu_id, dishForm.category_id]);


  // --- Dish Management Functions ---
  const fetchMenus = async () => {
    try {
      const res = await axios.get('/api/menus');
      setMenus(res.data);
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    }
  };

  const fetchDishCategories = useCallback(async (menuId) => {
    if (menuId) {
      try {
        const res = await axios.get(`/api/categories?menu_id=${menuId}`);
        setDishCategories(res.data);
      } catch (error) {
        console.error("Failed to fetch categories for dish form:", error);
        setDishCategories([]);
      }
    } else {
      setDishCategories([]);
    }
  }, []);

  const fetchDishes = async () => {
    try {
      const res = await axios.get('/api/dishes');
      setDishes(res.data);
    } catch (error) {
      console.error("Failed to fetch dishes:", error);
    }
  };

  const filterDishes = () => {
    let filtered = [...dishes];
    if (dishForm.menu_id) {
      filtered = filtered.filter(d => String(d.menu_id) === String(dishForm.menu_id));
    }
    if (dishForm.category_id) {
      filtered = filtered.filter(d => String(d.category_id) === String(dishForm.category_id));
    }
    setFilteredDishes(filtered);
  };

  const handleDishFormChange = (e) => {
    const { name, value, files } = e.target;
    const updatedValue = files ? files[0] : value;

    setDishForm(prev => {
      const updatedForm = { ...prev, [name]: updatedValue };
      if (name === 'menu_id') {
        fetchDishCategories(value);
        updatedForm.category_id = '';
      }
      return updatedForm;
    });
  };

  const handleDishSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(dishForm).forEach(key => {
        if (dishForm[key] !== null) formData.append(key, dishForm[key]);
    });

    try {
      if (editingDishId) {
        await axios.put(`/api/dishes/${editingDishId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/dishes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      resetDishForm();
      fetchDishes();
    } catch (error) {
      console.error("Error submitting dish form:", error.response?.data || error.message);
      alert("Ошибка при сохранении блюда: " + (error.response?.data?.error || error.message));
    }
  };

  const resetDishForm = () => {
    setDishForm({ menu_id: '', category_id: '', name: '', description: '', price: '', image: null, model: null, usdz: null });
    setEditingDishId(null);
    document.querySelectorAll('.dish-file-input').forEach(input => input.value = '');
    setDishCategories([]);
  };

  const handleEditDish = (dish) => {
    fetchDishCategories(dish.menu_id).then(() => {
      setDishForm({
        menu_id: String(dish.menu_id || ''),
        category_id: String(dish.category_id || ''),
        name: dish.name,
        description: dish.description || '',
        price: dish.price,
        image: null, model: null, usdz: null,
      });
      setEditingDishId(dish.id);
        // Scroll to dish form
      document.getElementById('dish-form-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleDeleteDish = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это блюдо?')) {
      try {
        await axios.delete(`/api/dishes/${id}`);
        fetchDishes();
      } catch (error) {
        console.error("Error deleting dish:", error.response?.data || error.message);
        alert("Ошибка при удалении блюда: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // --- Category Management Functions ---
  const fetchAllCategories = async () => {
    try {
        const res = await axios.get('/api/categories');
        setAllCategoriesForDisplay(res.data);
    } catch (error) {
        console.error("Failed to fetch all categories:", error);
    }
  };

  const generateSlug = (name) => {
    return name.toString().toLowerCase()
      .replace(/\s+/g, '-')       
      .replace(/[^\w-]+/g, '')    
      .replace(/--+/g, '-')       
      .replace(/^-+/, '')          
      .replace(/-+$/, '');         
  };

  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => {
        const newForm = { ...prev, [name]: value };
        if (name === 'name' && !editingCategoryId) { 
            newForm.slug = generateSlug(value);
        }
        return newForm;
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.slug || !categoryForm.menu_id) {
        alert("Название категории, слаг и меню обязательны.");
        return;
    }
    const payload = {
        name: categoryForm.name,
        slug: categoryForm.slug,
        position: parseInt(categoryForm.position, 10) || 0,
        menu_id: parseInt(categoryForm.menu_id, 10),
    };

    try {
        if (editingCategoryId) {
            await axios.put(`/api/categories/${editingCategoryId}`, payload);
        } else {
            await axios.post('/api/categories', payload);
        }
        resetCategoryForm();
        fetchAllCategories(); 
        if (dishForm.menu_id && String(payload.menu_id) === String(dishForm.menu_id)) {
            fetchDishCategories(dishForm.menu_id);
        }
    } catch (error) {
        console.error("Error submitting category form:", error.response?.data || error.message);
        alert("Ошибка: " + (error.response?.data?.error || error.message));
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ id: null, name: '', slug: '', position: 0, menu_id: '' });
    setEditingCategoryId(null);
  };

  const handleEditCategory = (category) => {
    setCategoryForm({
        id: category.id,
        name: category.name,
        slug: category.slug,
        position: category.position || 0,
        menu_id: String(category.menu_id || ''),
    });
    setEditingCategoryId(category.id);
    document.getElementById('category-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию? Это действие не может быть отменено.')) {
        try {
            await axios.delete(`/api/categories/${categoryId}`);
            fetchAllCategories(); 
            if (dishForm.menu_id) {
                fetchDishCategories(dishForm.menu_id);
            }
        } catch (error) {
            console.error("Error deleting category:", error.response?.data || error.message);
            alert("Ошибка при удалении категории: " + (error.response?.data?.error || "Проверьте, не используются ли блюда в этой категории."));
        }
    }
  };

  const filteredCategoriesForDisplay = categoryManagementMenuFilter
    ? allCategoriesForDisplay.filter(cat => String(cat.menu_id) === String(categoryManagementMenuFilter))
    : allCategoriesForDisplay;


  // --- Render ---
  return (
    <div className="p-6 max-w-4xl mx-auto bg-slate-800 text-gray-100 rounded-lg shadow-xl my-8 space-y-12">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4 sm:mb-0">
            Админ Панель
        </h1>
        <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/dashboard"
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Аналитика &rarr;
            </Link>
            <Link
              to="/admin/orders"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Заказы &rarr;
            </Link>
        </div>
      </div>

      {/* Section: Dish Management */}
      <section id="dish-form-section" className="p-6 bg-slate-750 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-5 text-yellow-300 border-b border-slate-600 pb-3">
          {editingDishId ? 'Изменить блюдо' : 'Управление товарами'}
        </h2>
        <form onSubmit={handleDishSubmit} className="space-y-4">
          {/* Dish form fields ... */}
          <div>
            <label htmlFor="dish_menu_id" className="block text-sm font-medium mb-1">Меню для блюда</label>
            <select name="menu_id" id="dish_menu_id" onChange={handleDishFormChange} value={dishForm.menu_id}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required>
              <option value="">Выберите меню</option>
              {menus.map(menu => (<option key={menu.id} value={menu.id}>{menu.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="dish_category_id" className="block text-sm font-medium mb-1">Категория для блюда</label>
            <select name="category_id" id="dish_category_id" onChange={handleDishFormChange} value={dishForm.category_id}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required
                    disabled={!dishForm.menu_id || dishCategories.length === 0}>
              <option value="">{dishCategories.length === 0 && dishForm.menu_id ? 'Нет категорий для этого меню' : 'Выберите категорию'}</option>
              {dishCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
            </select>
          </div>
            <div>
                <label htmlFor="dish_name" className="block text-sm font-medium mb-1">Название блюда</label>
                <input id="dish_name" name="name" placeholder="Название" onChange={handleDishFormChange} value={dishForm.name} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
            </div>
            <div>
                <label htmlFor="dish_description" className="block text-sm font-medium mb-1">Описание</label>
                <textarea id="dish_description" name="description" placeholder="Описание" onChange={handleDishFormChange} value={dishForm.description} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
            </div>
            <div>
                <label htmlFor="dish_price" className="block text-sm font-medium mb-1">Цена (₸)</label>
                <input id="dish_price" name="price" type="number" placeholder="Цена" onChange={handleDishFormChange} value={dishForm.price} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
            </div>
            <div>
                <label htmlFor="dish_image" className="block text-sm font-medium mb-1">Изображение</label>
                <input id="dish_image" name="image" type="file" accept="image/*" onChange={handleDishFormChange} className="dish-file-input w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600" />
            </div>
            <div>
                <label htmlFor="dish_model" className="block text-sm font-medium mb-1">3D Модель (.glb, .gltf)</label>
                <input id="dish_model" name="model" type="file" accept=".glb,.gltf" onChange={handleDishFormChange} className="dish-file-input w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600" />
            </div>
            <div>
                <label htmlFor="dish_usdz" className="block text-sm font-medium mb-1">3D Модель для iOS (.usdz)</label>
                <input id="dish_usdz" name="usdz" type="file" accept=".usdz" onChange={handleDishFormChange} className="dish-file-input w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600" />
            </div>
          <div className="flex space-x-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
              {editingDishId ? 'Обновить блюдо' : 'Добавить блюдо'}
            </button>
            {editingDishId && (
              <button type="button" onClick={resetDishForm} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Отмена
              </button>
            )}
          </div>
        </form>

        <h3 className="text-xl font-semibold mt-10 mb-4 pt-4 border-t border-slate-600 text-yellow-300">Список блюд</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="filter_dish_menu" className="block text-sm font-medium mb-1">Фильтр блюд по меню:</label>
                <select
                    name="menu_id" id="filter_dish_menu"
                    onChange={handleDishFormChange} 
                    value={dishForm.menu_id} 
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                >
                    <option value="">Все меню</option>
                    {menus.map(menu => (<option key={menu.id} value={menu.id}>{menu.name}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="filter_dish_category" className="block text-sm font-medium mb-1">Фильтр блюд по категории:</label>
                <select
                    name="category_id" id="filter_dish_category"
                    onChange={handleDishFormChange} 
                    value={dishForm.category_id} 
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                    disabled={!dishForm.menu_id || dishCategories.length === 0}
                >
                    <option value="">Все категории</option>
                    {dishCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
            </div>
        </div>
        <ul className="space-y-3">
          {filteredDishes.map((dish) => (
            <li key={dish.id} className="bg-slate-700 p-4 rounded-lg shadow hover:shadow-yellow-500/20 transition-shadow"
                onMouseEnter={() => setHoveredDishId(dish.id)} onMouseLeave={() => setHoveredDishId(null)}>
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <p className="font-bold text-lg text-white">{dish.name} — {dish.price}₸</p>
                  <p className="text-xs text-slate-400">Меню: {dish.menu_name || 'N/A'}, Категория: {dish.category_name || 'N/A'}</p>
                  {dish.description && <p className="text-sm text-slate-300 mt-1 max-w-md" title={dish.description}>{dish.description}</p>}
                  <div className="mt-2 space-x-2">
                    {dish.image_url && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Фото</span>}
                    {dish.model_url && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">GLB</span>}
                    {dish.model_url_usdz && <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">USDZ</span>}
                  </div>
                </div>
                <div className={`flex flex-col items-end sm:flex-row sm:items-center gap-2 flex-shrink-0 transition-opacity duration-300 ${hoveredDishId === dish.id ? 'opacity-100' : 'opacity-100'}`}>
                  <button onClick={() => handleEditDish(dish)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1.5 rounded-md text-xs w-full sm:w-auto">Изменить</button>
                  <button onClick={() => handleDeleteDish(dish.id)} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-md text-xs whitespace-nowrap sm:w-auto">Удалить</button>
                </div>
              </div>
            </li>
          ))}
          {filteredDishes.length === 0 && <p className="text-slate-400">Нет блюд для отображения с выбранными фильтрами.</p>}
        </ul>
      </section>

      {/* Section: Category Management */}
      <section id="category-form-section" className="p-6 bg-slate-750 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-5 text-yellow-300 border-b border-slate-600 pb-3">
          Управление категориями
        </h2>
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          {/* Category form fields ... */}
          <div>
            <label htmlFor="cat_menu_id" className="block text-sm font-medium mb-1">Принадлежит меню</label>
            <select
              name="menu_id" id="cat_menu_id" onChange={handleCategoryFormChange} value={categoryForm.menu_id}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required
            >
              <option value="">Выберите меню</option>
              {menus.map(menu => (<option key={menu.id} value={menu.id}>{menu.name}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="cat_name" className="block text-sm font-medium mb-1">Название категории</label>
            <input type="text" name="name" id="cat_name" placeholder="Название категории" onChange={handleCategoryFormChange} value={categoryForm.name}
                   className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
          </div>
          <div>
            <label htmlFor="cat_slug" className="block text-sm font-medium mb-1">Слаг (URL)</label>
            <input type="text" name="slug" id="cat_slug" placeholder="avtomaticheski-ili-vruchnuyu" onChange={handleCategoryFormChange} value={categoryForm.slug}
                   className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" required />
          </div>
          <div>
            <label htmlFor="cat_position" className="block text-sm font-medium mb-1">Позиция (сортировка)</label>
            <input type="number" name="position" id="cat_position" placeholder="0" onChange={handleCategoryFormChange} value={categoryForm.position}
                   className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
              {editingCategoryId ? 'Обновить категорию' : 'Добавить категорию'}
            </button>
            {editingCategoryId && (
              <button type="button" onClick={resetCategoryForm} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Отмена
              </button>
            )}
          </div>
        </form>

        <h3 className="text-xl font-semibold mt-10 mb-4 pt-4 border-t border-slate-600 text-yellow-300">Список категорий</h3>
        <div className="mb-4">
            <label htmlFor="cat_manage_menu_filter" className="block text-sm font-medium mb-1">Фильтр по меню:</label>
            <select
              name="menu_filter" id="cat_manage_menu_filter"
              onChange={(e) => setCategoryManagementMenuFilter(e.target.value)}
              value={categoryManagementMenuFilter}
              className="w-full sm:w-1/2 p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">Все меню</option>
              {menus.map(menu => (<option key={menu.id} value={menu.id}>{menu.name}</option>))}
            </select>
        </div>
        <ul className="space-y-3">
          {filteredCategoriesForDisplay.map(cat => (
            <li key={cat.id} className="bg-slate-700 p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <p className="font-bold text-white">{cat.name} <span className="text-xs text-slate-400">(slug: {cat.slug}, pos: {cat.position})</span></p>
                <p className="text-sm text-slate-300">Меню: {cat.menu_name || menus.find(m => m.id === cat.menu_id)?.name || 'N/A'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditCategory(cat)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1.5 rounded-md text-xs">Изменить</button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-md text-xs">Удалить</button>
              </div>
            </li>
          ))}
           {filteredCategoriesForDisplay.length === 0 && <p className="text-slate-400">Нет категорий для отображения с выбранным фильтром.</p>}
        </ul>
      </section>
    </div>
  );
};

export default DishManager;