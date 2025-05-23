import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '@google/model-viewer';

const SERVER_IP = '192.168.0.10';
const BACKEND_PORT = '5000';

const Menu = () => {
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const categoryRefs = useRef({});

  useEffect(() => {
    axios.get('/api/menus').then(res => {
      setMenus(res.data);
      setSelectedMenuId(res.data[0]?.id || null);
    });
  }, []);

  useEffect(() => {
    if (selectedMenuId) {
      axios.get(`/api/categories?menu_id=${selectedMenuId}`).then(res => {
        setCategories(res.data);
        setActiveCategory(res.data[0]?.id || null);
      });
      axios.get('/api/dishes').then(res => {
        const filtered = res.data.filter(d => d.menu_id === selectedMenuId);
        setDishes(filtered);
      });
    }
  }, [selectedMenuId]);

  useEffect(() => {
    const handleScroll = () => {
      const offsets = Object.entries(categoryRefs.current).map(([id, el]) => ({
        id,
        offset: el?.getBoundingClientRect().top
      })).filter(item => item.offset !== undefined);

      const visible = offsets.filter(item => item.offset <= 150);
      if (visible.length > 0) {
        setActiveCategory(Number(visible[visible.length - 1].id));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  const getDishesByCategory = (catId) => dishes.filter(d => d.category_id === catId);

  return (
    <div className="bg-slate-900 text-[#B3CFE2] min-h-screen max-w-3xl mx-auto px-4 py-6">
  <h1 className="text-3xl font-bold text-center mb-6">Меню</h1>

  <div className="flex gap-3 mb-6 justify-center">
    {menus.map(menu => (
      <button
        key={menu.id}
        onClick={() => setSelectedMenuId(menu.id)}
        className={`px-4 py-2 rounded-full font-semibold transition ${
          menu.id === selectedMenuId ? 'bg-black text-[#B3CFE2]' : 'bg-slate-900 hover:text-[#B3CFE2]'
        }`}
      >
        {menu.name}
      </button>
    ))}
  </div>

  {categories.length > 0 && (
  <div className="sticky top-0 z-50 bg-slate-900 flex gap-3 mb-6 overflow-x-auto pb-2 px-4 pt-4">
    {categories.map(cat => (
      <button
        key={cat.id}
        onClick={() => {
          const section = document.getElementById(`cat-${cat.id}`);
          section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
          cat.id === activeCategory
            ? 'bg-black text-[#B3CFE2]'
            : 'bg-slate-900 hover:text-[#B3CFE2]'
        }`}
      >
        {cat.name}
      </button>
    ))}
  </div>
)}


  {categories.map(category => (
    <div
      key={category.id}
      id={`cat-${category.id}`}
      ref={el => (categoryRefs.current[category.id] = el)}
      className="mb-10"
    >
      <h2 className="text-xl font-bold mb-4">{category.name}</h2>
      <div className="space-y-6">
        {getDishesByCategory(category.id).map(dish => (
          <div
            key={dish.id}
            className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl shadow-md bg-purple-900 hover:shadow-lg transition"
          >
            {dish.image_url && (
              <img
                src={`http://${SERVER_IP}:${BACKEND_PORT}${dish.image_url}`}
                alt={dish.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-lg">{dish.name}</p>
              <p className="text-sm text-gray-500">{dish.price} ₸</p>
            </div>
            {selectedMenuId === 1 && (
              <button
                onClick={() => setSelected(dish)}
                className="text-xl bg-yellow-400 hover:bg-yellow-300 text-black w-8 h-8 rounded-full flex items-center justify-center"
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  ))}

  {selected && (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white rounded-xl p-6 w-full max-w-md">
        <button
          onClick={() => setSelected(null)}
          className="absolute top-2 right-3 text-xl font-bold text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-4">{selected.name}</h2>
        <model-viewer
          src={`http://${SERVER_IP}:${BACKEND_PORT}${selected.model_url}`}
          ios-src={
            selected.model_url_usdz
              ? `http://${SERVER_IP}:${BACKEND_PORT}${selected.model_url_usdz}`
              : undefined
          }
          ar
          ar-modes="webxr scene-viewer quick-look"
          auto-rotate
          ar-scale="0.001 0.001 0.001"
          camera-controls
          style={{ width: '100%', height: '300px', background: '#000' }}
        >
          <button slot="ar-button" className="bg-yellow-500 text-black px-4 py-2 rounded mt-2">
            View in AR
          </button>
        </model-viewer>
      </div>
    </div>
  )}
</div>

  );
};

export default Menu;
