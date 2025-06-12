import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
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

    const stickyNavRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [navHeight, setNavHeight] = useState(0);

    // Этот ref будет нашим "флагом", чтобы отключать обработчик скролла во время клика
    const isClickScrolling = useRef(false);
    // Ref для таймера, чтобы его можно было очистить
    const scrollTimeout = useRef(null);

    const { cart, addToCart } = useCart();

    // Загрузка данных (без изменений)
    useEffect(() => {
        axios.get('/api/menus').then(res => {
            setMenus(res.data);
            if (res.data.length > 0) setSelectedMenuId(res.data[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedMenuId) {
            axios.get(`/api/categories?menu_id=${selectedMenuId}`).then(res => setCategories(res.data));
            axios.get('/api/dishes').then(res => {
                const filtered = res.data.filter(d => String(d.menu_id) === String(selectedMenuId));
                setDishes(filtered);
            });
        }
    }, [selectedMenuId]);

    // Измерение высоты панели (без изменений)
    useLayoutEffect(() => {
        if (stickyNavRef.current) {
            setNavHeight(stickyNavRef.current.offsetHeight);
        }
    }, [categories]);

    // Полностью переписанная логика скролла и кликов
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const handleScroll = () => {
            // Если сейчас идет программный скролл после клика - ничего не делаем
            if (isClickScrolling.current) {
                return;
            }

            // --- НАЧАЛО ИЗМЕНЕНИЙ ---

            // 1. Получаем позицию самого скролл-контейнера
            const containerTop = scrollContainer.getBoundingClientRect().top;

            const scrollThreshold = navHeight + 20;

            const offsets = Object.values(categoryRefs.current)
                .filter(el => el)
                .map(el => {
                    // 2. Получаем позицию заголовка относительно окна
                    const elementTop = el.getBoundingClientRect().top;
                    // 3. Вычисляем позицию ОТНОСИТЕЛЬНО контейнера
                    const relativeTop = elementTop - containerTop;
                    
                    return {
                        id: Number(el.id.replace('cat-', '')),
                        offset: relativeTop // Используем относительную позицию
                    };
                });

            const visible = offsets.filter(item => item.offset <= scrollThreshold);
            let newActiveCategory = null;

            if (visible.length > 0) {
                newActiveCategory = visible[visible.length - 1].id;
            } else if (categories.length > 0) {
                newActiveCategory = categories[0].id;
            }

            if (newActiveCategory) {
                setActiveCategory(newActiveCategory);
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        // Устанавливаем начальное состояние при загрузке
        if (categories.length > 0) {
            setActiveCategory(categories[0].id);
        }

        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [navHeight, categories]); // Убрали все лишние зависимости


    const handleCategoryClick = (catId) => {
        // 1. Устанавливаем флаг, чтобы обработчик скролла замолчал
        isClickScrolling.current = true;
        // 2. Сразу подсвечиваем нужную кнопку
        setActiveCategory(catId);
        // 3. Прокручиваем страницу
        document.getElementById(`cat-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 4. Через 1 секунду снова включаем обработчик скролла
        // Очищаем предыдущий таймер, если он был
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => {
            isClickScrolling.current = false;
        }, 1000);
    };

    const getDishesByCategory = (catId) => dishes.filter(d => String(d.category_id) === String(catId));
    const toggleDescription = (dishId) => setShowDescription(prev => ({ ...prev, [dishId]: !prev[dishId] }));

    return (
        <div ref={scrollContainerRef} className="bg-slate-900 text-[#B3CFE2] h-screen overflow-y-auto max-w-3xl mx-auto px-4 py-6 relative">
            <div className="sticky top-4 z-[60] flex justify-end pointer-events-none">
    <Link to="/cart" className="bg-black text-[#B3CFE2] p-2 rounded-full shadow-lg flex items-center hover:bg-slate-700 transition-colors pointer-events-auto">
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
                <div ref={stickyNavRef} className="sticky top-0 z-50 bg-slate-900 flex gap-3 mb-6 overflow-x-auto pb-2 px-1 pt-4 -mx-4 sm:px-4">
                    {categories.map(cat => (
                        <button key={cat.id} onClick={() => handleCategoryClick(cat.id)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${cat.id === activeCategory ? 'bg-black text-white ring-2 ring-yellow-400' : 'bg-slate-800 hover:bg-slate-700 text-[#B3CFE2]'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {categories.map(category => (
                <div key={category.id} id={`cat-${category.id}`} ref={el => (categoryRefs.current[category.id] = el)} className="mb-10">
                    <h2 className="text-xl font-bold mb-4 text-yellow-400 pt-4 -mt-4">{category.name}</h2>
                    <div className="space-y-6">
                        {getDishesByCategory(category.id).map(dish => (
                            <div key={dish.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-slate-700 rounded-xl shadow-md bg-slate-700 hover:shadow-lg transition transform hover:scale-[1.01]">
                                {dish.image_url && (<img src={`http://${SERVER_IP}:${BACKEND_PORT}${dish.image_url}`} alt={dish.name} className="w-full sm:w-24 h-40 sm:h-24 object-cover rounded-lg mb-2 sm:mb-0"/>)}
                                <div className="flex-1">
                                    <p className="font-semibold text-lg text-white">{dish.name}</p>
                                    <p className="text-sm text-slate-400">{dish.price} ₸</p>
                                    {showDescription[dish.id] && dish.description && (<p className="text-xs text-slate-300 mt-2 p-2 bg-slate-800 rounded text-justify">{dish.description}</p>)}
                                </div>
                                <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
                                    {selectedMenuId === 1 && dish.model_url && (<button onClick={() => setSelected(dish)} className="text-lg bg-yellow-400 hover:bg-yellow-300 text-black w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110" title="View in AR">AR</button>)}
                                    {dish.description && (<button onClick={() => toggleDescription(dish.id)} className="text-lg bg-slate-700 hover:bg-slate-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110" title={showDescription[dish.id] ? "Скрыть описание" : "Показать описание"}>{showDescription[dish.id] ? '△' : '▽'}</button>)}
                                    <button onClick={() => addToCart(dish)} className="text-xl bg-green-600 hover:bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110" title="Добавить в корзину">🛒</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default Menu;