import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        
        
        
        
        window.location.href = '/login'; 
        return;
    }
    fetchOrders(token);
  }, []);

  const fetchOrders = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/orders', {
        
      });
      setOrders(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Не удалось загрузить заказы. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('token');
    
    if (!window.confirm(`Вы уверены, что хотите изменить статус заказа #${orderId} на "${newStatus}"?`)) {
        return;
    }
    try {
      const response = await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, {
        
      });
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, order_status: response.data.order_status } : order
        )
      );
      alert(`Статус заказа #${orderId} успешно изменен на "${response.data.order_status}".`);
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Ошибка при изменении статуса заказа: ' + (err.response?.data?.error || err.message));
    }
  };


  if (loading) return <div className="p-4 text-center text-gray-100">Загрузка заказов...</div>;
  if (error) return <div className="p-4 text-center text-red-500 bg-slate-800 rounded-md">{error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto bg-slate-900 text-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-4 sm:mb-0">Управление заказами</h1>
        <Link to="/admin" className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors self-start sm:self-center">
            &larr; К Управлению Товарами
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-center py-10">Новых заказов нет.</p>
      ) : (
        <div className="overflow-x-auto bg-slate-800 shadow-lg rounded-lg">
          <table className="min-w-full table-auto">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Клиент</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Телефон</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Адрес</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Сумма</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Статус</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Дата</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Товары</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap text-sm">{order.id}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">{order.customer_details.firstName} {order.customer_details.lastName}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">{order.customer_details.phone}</td>
                  <td className="px-3 py-3 text-sm max-w-xs truncate" title={order.customer_details.address}>{order.customer_details.address}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">{parseFloat(order.total_amount).toFixed(2)} ₸</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.order_status === 'new' ? 'bg-blue-500 text-blue-100' :
                      order.order_status === 'completed' ? 'bg-green-500 text-green-100' :
                      order.order_status === 'cancelled' ? 'bg-red-500 text-red-100' :
                      'bg-gray-500 text-gray-100'
                    }`}>
                      {order.order_status === 'new' ? 'Новый' : 
                       order.order_status === 'completed' ? 'Выполнено' : 
                       order.order_status === 'cancelled' ? 'Отменен' : 
                       order.order_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">{new Date(order.created_at).toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm">
                    <ul className="list-none p-0 m-0 space-y-1">
                      {order.order_items && Array.isArray(order.order_items) && order.order_items.map((item, index) => (
                        <li key={index} className="text-xs">
                          {item.name} (x{item.quantity}) - {item.price * item.quantity} ₸
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm">
                    {order.order_status === 'new' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'completed')}
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-md text-xs transition-colors"
                      >
                        Выполнено
                      </button>
                    )}
                     {/* You can add more status change buttons here, e.g., to "cancelled" */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;