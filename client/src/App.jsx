
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DishManager from './pages/DishManager';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Register from './pages/Register';
import CartPage from './pages/CartPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; 

function App() {
  return (
    <div className="">
      <BrowserRouter>
        <Routes>
          {}
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} /> {/* New Dashboard Route */}
          <Route path="/admin" element={<DishManager />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />

          {}
          <Route path="/menu" element={<Menu />} />
          <Route path="/cart" element={<CartPage />} />

          {}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;