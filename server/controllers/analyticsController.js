// server/controllers/analyticsController.js
import pool from '../db.js';
import xlsx from 'xlsx'; // Ensure you have run: npm install xlsx

// --- Helper functions for Report Generation with Date Filters ---

const fetchOrderReportData = async (startDate, endDate) => {
  const result = await pool.query(
    "SELECT id, customer_details, order_items, total_amount, order_status, created_at FROM orders WHERE order_status = 'completed' AND created_at >= $1 AND created_at < $2 ORDER BY created_at DESC",
    [startDate, endDate]
  );
  // Format data for Excel
  return result.rows.map(order => {
    const items = order.order_items.map(item => `${item.name} (x${item.quantity || 1}) - ${(item.price || 0) * (item.quantity || 1)}₸`).join('\n');
    return {
      'ID Заказа': order.id,
      'Клиент Имя': order.customer_details.firstName,
      'Клиент Фамилия': order.customer_details.lastName,
      'Телефон': order.customer_details.phone,
      'Адрес': order.customer_details.address,
      'Товары': items,
      'Сумма (₸)': parseFloat(order.total_amount).toFixed(2),
      'Статус': order.order_status,
      'Дата Заказа': new Date(order.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short'}),
    };
  });
};

const fetchDishSalesReportData = async (startDate, endDate) => {
  const query = `
    SELECT
      item.name AS "Название блюда",
      SUM(item.quantity::integer) AS "Продано (шт)",
      SUM((item.price::decimal * item.quantity::integer)) AS "Выручка (₸)"
    FROM
      orders,
      jsonb_to_recordset(orders.order_items) AS item(id int, name text, quantity text, price text)
    WHERE orders.order_status = 'completed' AND orders.created_at >= $1 AND orders.created_at < $2
    GROUP BY item.name
    ORDER BY "Выручка (₸)" DESC;
  `;
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows.map(row => ({
    ...row,
    "Выручка (₸)": parseFloat(row["Выручка (₸)"]).toFixed(2) // Ensure correct parsing for display
  }));
};

const fetchCategorySalesReportData = async (startDate, endDate) => {
  const query = `
    SELECT
      c.name AS "Категория",
      SUM(oi.quantity::integer) AS "Продано (шт)",
      SUM((oi.price::decimal * oi.quantity::integer)) AS "Выручка (₸)"
    FROM
      orders o,
      jsonb_to_recordset(o.order_items) AS oi(id int, name text, quantity text, price text)
    JOIN
      dishes d ON d.id = oi.id
    JOIN
      categories c ON c.id = d.category_id
    WHERE o.order_status = 'completed' AND o.created_at >= $1 AND o.created_at < $2
    GROUP BY c.name
    ORDER BY "Выручка (₸)" DESC;
  `;
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows.map(row => ({
    ...row,
    "Выручка (₸)": parseFloat(row["Выручка (₸)"]).toFixed(2)
  }));
};

const fetchMenuSalesReportData = async (startDate, endDate) => {
  const query = `
    SELECT
      m.name AS "Меню",
      SUM(oi.quantity::integer) AS "Продано (шт)",
      SUM((oi.price::decimal * oi.quantity::integer)) AS "Выручка (₸)"
    FROM
      orders o,
      jsonb_to_recordset(o.order_items) AS oi(id int, name text, quantity text, price text)
    JOIN
      dishes d ON d.id = oi.id
    JOIN
      menus m ON m.id = d.menu_id
    WHERE o.order_status = 'completed' AND o.created_at >= $1 AND o.created_at < $2
    GROUP BY m.name
    ORDER BY "Выручка (₸)" DESC;
  `;
  const result = await pool.query(query, [startDate, endDate]);
  return result.rows.map(row => ({
    ...row,
    "Выручка (₸)": parseFloat(row["Выручка (₸)"]).toFixed(2)
  }));
};

// --- Main function for downloading sales report ---
export const downloadSalesReport = async (req, res) => {
  const { period, specificDate, reportType = 'orders' } = req.query;

  let startDate, endDate;
  const today = new Date();
  let reportDateRef = specificDate ? new Date(specificDate) : today;

  // Validate specificDate
  if (isNaN(reportDateRef.getTime())) {
    reportDateRef = today; // Default to today if specificDate is invalid
  }
  
  // Normalize reportDateRef to the start of its day to avoid time zone issues with date boundaries
  reportDateRef.setHours(0, 0, 0, 0);


  switch (period) {
    case 'day':
      startDate = new Date(reportDateRef);
      endDate = new Date(reportDateRef);
      endDate.setDate(reportDateRef.getDate() + 1);
      break;
    case 'week':
      // For 'week', reportDateRef is the END of the week (e.g., Sunday or selected day)
      // The week will be 7 days ending on reportDateRef
      endDate = new Date(reportDateRef);
      endDate.setDate(reportDateRef.getDate() + 1); // End of the specified day
      startDate = new Date(reportDateRef);
      startDate.setDate(reportDateRef.getDate() - 6); // Start 7 days ago (inclusive of reportDateRef)
      break;
    case 'month':
      startDate = new Date(reportDateRef.getFullYear(), reportDateRef.getMonth(), 1);
      endDate = new Date(reportDateRef.getFullYear(), reportDateRef.getMonth() + 1, 1);
      break;
    case 'year':
      startDate = new Date(reportDateRef.getFullYear(), 0, 1);
      endDate = new Date(reportDateRef.getFullYear() + 1, 0, 1);
      break;
    default:
      return res.status(400).json({ error: 'Invalid report period specified.' });
  }

  try {
    let reportData;
    let sheetName = 'Отчет'; // Default sheet name

    switch (reportType) {
      case 'orders':
        reportData = await fetchOrderReportData(startDate, endDate);
        sheetName = 'Детализация по заказам';
        break;
      case 'dishes':
        reportData = await fetchDishSalesReportData(startDate, endDate);
        sheetName = 'Продажи по блюдам';
        break;
      case 'categories':
        reportData = await fetchCategorySalesReportData(startDate, endDate);
        sheetName = 'Продажи по категориям';
        break;
      case 'menus':
        reportData = await fetchMenuSalesReportData(startDate, endDate);
        sheetName = 'Продажи по меню';
        break;
      default:
        return res.status(400).json({ error: 'Invalid report type specified.' });
    }

    if (!reportData || reportData.length === 0) {
      return res.status(404).json({ error: `Нет данных для отчета '${sheetName}' за выбранный период.` });
    }

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(reportData);
    xlsx.utils.book_append_sheet(wb, ws, sheetName);

    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const dateForFilename = specificDate ? new Date(specificDate).toISOString().split('T')[0] : today.toISOString().split('T')[0];
    const fileName = `report_${reportType}_${period}_${dateForFilename}.xlsx`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);

  } catch (err) {
    console.error(`Error generating ${reportType} sales report:`, err.message, err.stack);
    res.status(500).json({ error: `Failed to generate ${reportType} sales report.` });
  }
};


// --- Dashboard Summary Functions (can remain or be refactored if dashboard needs date ranges) ---
export const getTotalSalesSummary = async (req, res) => {
  try {
    const totalSalesResult = await pool.query(
      "SELECT SUM(total_amount) AS total_revenue, COUNT(*) AS total_orders FROM orders WHERE order_status = 'completed'"
    );
    const newOrdersResult = await pool.query(
      "SELECT COUNT(*) AS new_orders_count FROM orders WHERE order_status = 'new'"
    );
    res.json({
      total_revenue: parseFloat(totalSalesResult.rows[0].total_revenue) || 0,
      total_completed_orders: parseInt(totalSalesResult.rows[0].total_orders) || 0,
      new_orders_count: parseInt(newOrdersResult.rows[0].new_orders_count) || 0,
    });
  } catch (err) {
    console.error('Error fetching total sales summary:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSalesByDish = async (req, res) => {
  try {
    const query = `
      SELECT
        item.id AS dish_id,
        item.name AS dish_name,
        SUM((item.price::decimal * item.quantity::integer)) AS total_revenue,
        SUM(item.quantity::integer) AS total_quantity_sold
      FROM
        orders,
        jsonb_to_recordset(orders.order_items) AS item(id int, name text, quantity text, price text)
      WHERE orders.order_status = 'completed'
      GROUP BY item.id, item.name
      ORDER BY total_revenue DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(row => ({
        ...row,
        total_revenue: parseFloat(row.total_revenue)
    })));
  } catch (err) {
    console.error('Error fetching sales by dish:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSalesByCategory = async (req, res) => {
  try {
    const query = `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        SUM((oi.price::decimal * oi.quantity::integer)) AS total_revenue,
        SUM(oi.quantity::integer) AS total_quantity_sold
      FROM
        orders o,
        jsonb_to_recordset(o.order_items) AS oi(id int, name text, quantity text, price text)
      JOIN
        dishes d ON d.id = oi.id
      JOIN
        categories c ON c.id = d.category_id
      WHERE o.order_status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC;
    `;
    const result = await pool.query(query);
     res.json(result.rows.map(row => ({
        ...row,
        total_revenue: parseFloat(row.total_revenue)
    })));
  } catch (err) {
    console.error('Error fetching sales by category:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSalesByMenu = async (req, res) => {
  try {
    const query = `
      SELECT
        m.id AS menu_id,
        m.name AS menu_name,
        SUM((oi.price::decimal * oi.quantity::integer)) AS total_revenue,
        SUM(oi.quantity::integer) AS total_quantity_sold
      FROM
        orders o,
        jsonb_to_recordset(o.order_items) AS oi(id int, name text, quantity text, price text)
      JOIN
        dishes d ON d.id = oi.id
      JOIN
        menus m ON m.id = d.menu_id
      WHERE o.order_status = 'completed'
      GROUP BY m.id, m.name
      ORDER BY total_revenue DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows.map(row => ({
        ...row,
        total_revenue: parseFloat(row.total_revenue)
    })));
  } catch (err) {
    console.error('Error fetching sales by menu:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};