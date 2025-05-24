import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';


const StatCard = ({ title, value, subValue, subTitle }) => (
  <div className="bg-slate-750 p-6 rounded-lg shadow-lg">
    <h3 className="text-sm font-medium text-yellow-400 uppercase">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-white">{value}</p>
    {subTitle && <p className="text-xs text-slate-400">{subValue} {subTitle}</p>}
  </div>
);

const DataList = ({ title, data, valueKey, nameKey, unit = '' }) => (
  <div className="bg-slate-750 p-6 rounded-lg shadow-lg">
    <h3 className="text-lg font-semibold text-yellow-300 mb-3">{title}</h3>
    {data && data.length > 0 ? (
      <ul className="space-y-2 max-h-60 overflow-y-auto">
        {data.map((item, index) => (
          <li key={index} className="flex justify-between items-center text-sm p-2 bg-slate-700 rounded">
            <span>{item[nameKey]} {item.total_quantity_sold ? `(x${item.total_quantity_sold})` : ''}</span>
            <span className="font-semibold">{parseFloat(item[valueKey]).toFixed(2)}{unit}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-slate-400">Нет данных для отображения.</p>
    )}
  </div>
);

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [salesByDish, setSalesByDish] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [salesByMenu, setSalesByMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('day');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedReportType, setSelectedReportType] = useState('orders'); 

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    fetchAllAnalytics(token);
  }, []);

  const fetchAllAnalytics = async (token) => {
    
    setLoading(true);
    setError('');
    try {
      const headers = { };
      const [
        summaryRes,
        dishRes,
        categoryRes,
        menuRes
      ] = await Promise.all([
        axios.get('/api/analytics/summary', { headers }),
        axios.get('/api/analytics/by-dish', { headers }),
        axios.get('/api/analytics/by-category', { headers }),
        axios.get('/api/analytics/by-menu', { headers }),
      ]);
      setSummary(summaryRes.data);
      setSalesByDish(dishRes.data);
      setSalesByCategory(categoryRes.data);
      setSalesByMenu(menuRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Не удалось загрузить аналитику. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportPeriod || !selectedReportType) {
      alert('Пожалуйста, выберите тип и период для отчета.');
      return;
    }
    
    try {
      const response = await axios.get('/api/analytics/sales-report', {
        params: {
          reportType: selectedReportType, 
          period: reportPeriod,
          specificDate: (reportPeriod === 'day' || reportPeriod === 'month' || reportPeriod === 'year' || reportPeriod === 'week') ? reportDate : undefined,
        },
        
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      
      let desiredFilename = `report_${selectedReportType}_${reportPeriod}_${reportDate || new Date().toISOString().split('T')[0]}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
          const filenameRegex = /filename\*?=['"]?(?:UTF-\d'')?([^;\r\n"']+)['"]?/i;
          const matches = filenameRegex.exec(contentDisposition);
          if (matches != null && matches[1]) {
              desiredFilename = matches[1].replace(/\.xlsx_?$/i, '').replace(/_$/, '');
          }
      }
      if (!desiredFilename.toLowerCase().endsWith('.xlsx')) {
          desiredFilename += '.xlsx';
      }
      
      link.download = desiredFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      setShowReportModal(false);

    } catch (error) {
        
      console.error('Error downloading report:', error.response || error);
      const errorData = error.response?.data;
      if(errorData instanceof Blob && errorData.type === "application/json") {
        const reader = new FileReader();
        reader.onload = function() {
            const jsonError = JSON.parse(reader.result);
            alert(`Ошибка при скачивании отчета: ${jsonError.error || 'Неизвестная ошибка'}`);
        };
        reader.readAsText(errorData);
      } else {
        alert(`Ошибка при скачивании отчета: ${error.response?.data?.error || error.message || 'Проверьте консоль для деталей.'}`);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-100 text-xl">Загрузка аналитики...</div>;
  if (error) return <div className="p-10 text-center text-red-500 bg-slate-800 rounded-md text-xl">{error}</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full mx-auto bg-slate-900 text-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4 sm:mb-0">Панель Аналитики</h1>
        <div className="flex flex-wrap gap-3">
            <button
                onClick={() => setShowReportModal(true)}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                Скачать отчет
            </button>
            <Link to="/admin" className="text-sm bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                Управление Товарами
            </Link>
            <Link to="/admin/orders" className="text-sm bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                Управление Заказами
            </Link>
        </div>
      </div>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]">
          <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-yellow-300">Параметры отчета</h2>
            <div className="space-y-4">
              {/* Report Type Selector */}
              <div>
                <label htmlFor="reportType" className="block text-sm font-medium text-slate-300">Тип отчета:</label>
                <select
                  id="reportType"
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="mt-1 block w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="orders">Детализация по заказам</option>
                  <option value="dishes">Продажи по блюдам</option>
                  <option value="categories">Продажи по категориям</option>
                  <option value="menus">Продажи по меню</option>
                </select>
              </div>
              {/* Period Selector */}
              <div>
                <label htmlFor="reportPeriod" className="block text-sm font-medium text-slate-300">Период:</label>
                <select
                  id="reportPeriod"
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="mt-1 block w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="day">За день</option>
                  <option value="week">За неделю (последние 7 дней от даты)</option>
                  <option value="month">За месяц</option>
                  <option value="year">За год</option>
                </select>
              </div>
              {/* Date Selector (remains the same) */}
              {(reportPeriod === 'day' || reportPeriod === 'month' || reportPeriod === 'year' || reportPeriod === 'week') && (
                <div>
                  <label htmlFor="reportDate" className="block text-sm font-medium text-slate-300">
                    {/* ... label logic ... */}
                    {reportPeriod === 'day' ? 'Дата:' : 
                     reportPeriod === 'week' ? 'Конечная дата недели:' : 
                     reportPeriod === 'month' ? 'Месяц и год:' : 
                     'Год:'}
                  </label>
                  <input
                    type={reportPeriod === 'month' ? 'month' : reportPeriod === 'year' ? 'number' : 'date'}
                    id="reportDate"
                    value={reportPeriod === 'year' ? reportDate.substring(0,4) : reportPeriod === 'month' ? reportDate.substring(0,7) : reportDate}
                    onChange={(e) => {
                        if (reportPeriod === 'year') setReportDate(`${e.target.value}-01-01`);
                        else if (reportPeriod === 'month') setReportDate(`${e.target.value}-01`);
                        else setReportDate(e.target.value);
                    }}
                    className="mt-1 block w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                    max={new Date().toISOString().split('T')[0]}
                  />
                   {reportPeriod === 'year' && <p className="text-xs text-slate-400 mt-1">Введите год (например, 2024)</p>}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={() => setShowReportModal(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Отмена</button>
              <button type="button" onClick={handleDownloadReport} className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">Скачать</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats (remains the same) */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Общая выручка" value={`${summary.total_revenue.toFixed(2)} ₸`} />
          <StatCard title="Выполненных заказов" value={summary.total_completed_orders} />
          <StatCard title="Новых заказов" value={summary.new_orders_count} />
        </div>
      )}

      {/* Detailed Sales Data on Dashboard (remains the same) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DataList title="Продажи по блюдам" data={salesByDish} valueKey="total_revenue" nameKey="dish_name" unit=" ₸"/>
        <DataList title="Продажи по категориям" data={salesByCategory} valueKey="total_revenue" nameKey="category_name" unit=" ₸"/>
        <DataList title="Продажи по меню" data={salesByMenu} valueKey="total_revenue" nameKey="menu_name" unit=" ₸"/>
      </div>
    </div>
  );
};

export default AdminDashboardPage;