import React, { useState } from 'react';
import { useCart } from '../pages/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SERVER_IP = '172.20.10.3';
const BACKEND_PORT = '5000';

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
  });

  const handleQuantityChange = (dishId, newQuantity) => {
    updateQuantity(dishId, parseInt(newQuantity, 10));
  };

  const handleConfirmOrder = () => {
    if (cart.length === 0) {
      alert('Ваша корзина пуста!');
      return;
    }
    setShowOrderForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e) => { 
    e.preventDefault();
    if (!orderDetails.firstName || !orderDetails.lastName || !orderDetails.phone || !orderDetails.address) {
      alert('Пожалуйста, заполните все поля для заказа.');
      return;
    }

    const orderData = {
      cart: cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image_url: item.image_url
      })),
      orderDetails,
      total: getCartTotal(),
    };

    try {    
      const response = await axios.post('/api/orders', orderData);
      console.log('Order submitted successfully:', response.data);
      alert('Заказ успешно оформлен! Спасибо!');
      clearCart();
      setShowOrderForm(false);
      navigate('/menu');
    } catch (error) {
      console.error('Failed to submit order:', error.response ? error.response.data : error.message);
      alert(`Ошибка при оформлении заказа: ${error.response ? error.response.data.error : error.message}`);
    }
  };

  if (cart.length === 0 && !showOrderForm) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-slate-800 text-white rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">Ваша корзина</h1>
        <p className="text-center text-lg">Корзина пуста.</p>
        <div className="text-center mt-6">
          <Link to="/menu" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-6 rounded-lg transition-colors">
            Вернуться в меню
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-slate-800 text-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-400">Ваша корзина</h1>
        <Link to="/menu" className="text-sm text-yellow-500 hover:text-yellow-300">&larr; Вернуться в меню</Link>
      </div>

      {!showOrderForm ? (
        <>
          {cart.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mb-4 border border-slate-700 rounded-lg bg-purple-900">
              {item.image_url && (
                <img
                  src={`http://${SERVER_IP}:${BACKEND_PORT}${item.image_url}`}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
              )}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold">{item.name}</h2>
                <p className="text-sm text-slate-400">{item.price} ₸</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-3 rounded"
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                  className="w-12 text-center bg-slate-800 border border-slate-600 rounded p-1"
                  min="1"
                />
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-1 px-3 rounded"
                >
                  +
                </button>
              </div>
              <p className="font-semibold w-24 text-center sm:text-right">{item.price * item.quantity} ₸</p>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:text-red-400 font-semibold"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="mt-8 pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center text-xl font-bold mb-6">
              <span>Итого:</span>
              <span>{getCartTotal()} ₸</span>
            </div>
            <button
              onClick={handleConfirmOrder}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              Подтверждаю заказ
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handlePayment} className="space-y-6">
          <h2 className="text-2xl font-semibold text-center text-yellow-400 mb-6">Детали заказа</h2>
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-300 mb-1">Имя</label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              value={orderDetails.firstName}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-300 mb-1">Фамилия</label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              value={orderDetails.lastName}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">Номер телефона</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              value={orderDetails.phone}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-1">Адрес доставки</label>
            <textarea
              name="address"
              id="address"
              rows="3"
              value={orderDetails.address}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            ></textarea>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-700">
            <div className="flex justify-between items-center text-xl font-bold mb-6">
                <span>К оплате:</span>
                <span>{getCartTotal()} ₸</span>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              Оплатить
            </button>
          </div>
           <button
              type="button"
              onClick={() => setShowOrderForm(false)}
              className="w-full mt-4 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Назад к корзине
            </button>
        </form>
      )}
    </div>
  );
};

export default CartPage;