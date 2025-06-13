import React, { useState } from 'react';
import { useCart } from '../pages/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRCode from "react-qr-code";

const SERVER_IP = '192.168.113.48';
const BACKEND_PORT = '5000';

const transliterate = (text) => {
    const cyrillicMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': "'", 'э': 'e', 'ю': 'yu',
        'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
        'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
        'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
        'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': "'", 'Э': 'E', 'Ю': 'Yu',
        'Я': 'Ya'
    };

    return text.split('').map(char => cyrillicMap[char] || char).join('');
};

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
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');

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

  const generateOrderForWaiter = () => {
    if (cart.length === 0) {
      alert('Ваша корзина пуста!');
      return;
    }

    let orderText = `New Order:\n`;
    orderText += `Date: ${new Date().toLocaleString()}\n\n`;
    orderText += "Items:\n";
    cart.forEach(item => {
      const itemName = transliterate(item.name);
      orderText += `- ${itemName} (x${item.quantity}) - ${item.price * item.quantity} KZT\n`;
    });
    orderText += `\nTotal: ${getCartTotal()} KZT`;

    setQrCodeValue(orderText);
    setShowQRCode(true);
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
  
  if (showQRCode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100]">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Заказ для Официанта</h2>
            <p className="text-slate-300 mb-6">Покажите этот QR-код вашему официанту.</p>
            <div className="p-4 bg-white rounded-lg flex justify-center">
                <QRCode value={qrCodeValue} size={256} />
            </div>
            <button
                onClick={() => {
                    setShowQRCode(false);
                    clearCart();
                    navigate('/menu');
                }}
                className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
            >
                Готово (Очистить корзину)
            </button>
             <button
              type="button"
              onClick={() => setShowQRCode(false)}
              className="w-full mt-4 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Назад к корзине
            </button>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-yellow-400">Ваша Корзина</h1>
        <Link to="/menu" className="text-sm text-yellow-500 hover:text-yellow-300">&larr; Вернуться в меню</Link>
      </div>

      {!showOrderForm ? (
        <>
          {cart.map(item => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mb-4 border border-slate-700 rounded-lg bg-slate-750">
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
            <div className="flex flex-col md:flex-row gap-4">
                <button
                onClick={handleConfirmOrder}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
                >
                Заказать доставку
                </button>
                <button
                onClick={generateOrderForWaiter}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
                >
                Сформировать заказ для официанта
                </button>
            </div>
          </div>
        </>
      ) : (
        <form onSubmit={handlePayment} className="space-y-6">
           <h2 className="text-2xl font-semibold text-center text-yellow-400 mb-6">Детали заказа для доставки</h2>
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
              Оплатить и заказать доставку
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