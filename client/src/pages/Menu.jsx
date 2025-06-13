import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '@google/model-viewer';
import { Link } from 'react-router-dom';
import { useCart } from '../pages/CartContext';

const SERVER_IP = '192.168.133.48';
const BACKEND_PORT = '5000';

const Menu = () => {
    const [menus, setMenus] = useState([]);
    const [selectedMenuId, setSelectedMenuId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [dishes, setDishes] = useState([]);
    const [selected, setSelected] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const categoryRefs = useRef({});
    const [showDescription, setShowDescription] = useState({});

    const { cart, addToCart } = useCart();

    useEffect(() => {
        axios.get('/api/menus').then(res => {
            setMenus(res.data);
            if (res.data.length > 0) setSelectedMenuId(res.data[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedMenuId) {
            axios.get(`/api/categories?menu_id=${selectedMenuId}`).then(res => {
                setCategories(res.data)
                if (res.data.length > 0) {
                    setActiveCategory(res.data[0].id);
                }
            });
            axios.get('/api/dishes').then(res => {
                const filtered = res.data.filter(d => String(d.menu_id) === String(selectedMenuId));
                setDishes(filtered);
            });
        }
    }, [selectedMenuId]);
    
    useEffect(() => {
        const handleScroll = () => {
            const scrollThreshold = 150; 
            
            const offsets = Object.entries(categoryRefs.current)
              .map(([id, el]) => ({
                id: Number(id),
                top: el?.getBoundingClientRect().top 
              }))
              .filter(item => item.top !== undefined);
            
            const visible = offsets.filter(item => item.top <= scrollThreshold);

            if (visible.length > 0) {
                setActiveCategory(visible[visible.length - 1].id);
            } else if (categories.length > 0) {
                setActiveCategory(categories[0].id);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [categories]);

    const getDishesByCategory = (catId) => dishes.filter(d => String(d.category_id) === String(catId));
    
    const toggleDescription = (dishId) => {
        setShowDescription(prev => ({ ...prev, [dishId]: !prev[dishId] }));
    };

    return (
        <div className="bg-slate-900 text-[#B3CFE2] min-h-screen max-w-3xl mx-auto px-4 py-6 relative">
            
            <div className="fixed bottom-[80px] right-5 md:top-5 md:right-8 md:bottom-auto z-[60]">
                <Link to="/cart" className="bg-black text-[#B3CFE2] p-4 rounded-full shadow-lg flex items-center hover:bg-slate-700 transition-colors pointer-events-auto">
                    <span>🛒</span>
                    {cart.length > 0 && (
                    <span className="bg-yellow-400 text-black text-xs font-bold rounded-full px-2 py-1 ml-2">
                        {cart.reduce((total, item) => total + item.quantity, 0)}
                    </span>
                    )}
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-center mb-6 pt-12">Меню</h1>

            <div className="flex gap-3 mb-6 justify-center">
                {menus.map(menu => (
                    <button key={menu.id} onClick={() => setSelectedMenuId(menu.id)} className={`px-4 py-2 rounded-full font-semibold transition ${menu.id === selectedMenuId ? 'bg-black text-white ring-2 ring-yellow-400' : 'bg-slate-800 hover:bg-slate-700 text-[#B3CFE2]'}`}>
                        {menu.name}
                    </button>
                ))}
            </div>

            {categories.length > 0 && (
                <div className="sticky top-0 z-50 bg-slate-900 flex justify-center gap-3 mb-6 overflow-x-auto pb-2 px-1 pt-4 -mx-4 sm:px-4">
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => {
                            document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${cat.id === activeCategory ? 'bg-black text-white ring-2 ring-yellow-400' : 'bg-slate-800 hover:bg-slate-700 text-[#B3CFE2]'}`}>
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
                    <h2 className="text-xl font-bold mb-4 text-yellow-400">{category.name}</h2>
                    
                    <div className="space-y-6">
                        {getDishesByCategory(category.id).map(dish => (
                           <div key={dish.id}>
                                <div
                                    className="flex items-center gap-4 p-4 border-slate-700 rounded-xl shadow-md bg-slate-700 hover:shadow-lg transition transform hover:scale-[1.01] cursor-pointer"
                                    onClick={() => dish.description && toggleDescription(dish.id)}
                                >
                                    {dish.image_url && (
                                        <img
                                            src={`http://${SERVER_IP}:${BACKEND_PORT}${dish.image_url}`}
                                            alt={dish.name}
                                            className="w-20 h-20 object-cover rounded flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-semibold text-lg text-white">{dish.name}</p>
                                        <p className="text-sm text-slate-400">{dish.price} ₸</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedMenuId === 1 && dish.model_url && (
                                            <button onClick={(e) => { e.stopPropagation(); setSelected(dish); }} className="text-lg bg-yellow-400 hover:bg-yellow-300 text-black w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110" title="View in AR">AR</button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); addToCart(dish); }} className="text-xl bg-green-600 hover:bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110" title="Добавить в корзину">🛒</button>
                                    </div>
                                </div>
                                {showDescription[dish.id] && dish.description && (
                                    <p className="text-xs text-slate-300 mt-2 p-3 bg-slate-800 rounded text-justify">
                                        {dish.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {selected && selected.model_url && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[70]">
                    <div className="relative bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
                        <button
                            onClick={() => setSelected(null)}
                            className="absolute top-3 right-3 text-2xl font-bold text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-white">{selected.name}</h2>
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
                            camera-controls
                            ar-scale="auto"
                            style={{ width: '100%', height: '350px', background: '#2d3748', borderRadius: '8px' }}
                        >
                            <button slot="ar-button" className="bg-yellow-500 text-black px-6 py-3 rounded-lg mt-4 font-semibold absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                Посмотреть в AR
                            </button>
                        </model-viewer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Menu;