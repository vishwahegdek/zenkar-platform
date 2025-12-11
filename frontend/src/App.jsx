
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import OrdersList from './pages/OrdersList';
import OrderDetails from './pages/OrderDetails';
import OrderForm from './pages/OrderForm';
import ProductsList from './pages/ProductsList';
import ProductForm from './pages/ProductForm';
import CustomersList from './pages/CustomersList';
import CustomerForm from './pages/CustomerForm';
import QuickSale from './pages/QuickSale';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';

const queryClient = new QueryClient();

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }>
              <Route index element={<Navigate to="/orders" replace />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="quick-sale" element={<QuickSale />} />
              <Route path="orders/new" element={<OrderForm />} />
              <Route path="orders/:id" element={<OrderDetails />} />
              <Route path="orders/:id/edit" element={<OrderForm />} />
              
              <Route path="products" element={<ProductsList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />

              <Route path="customers" element={<CustomersList />} />
              <Route path="customers/new" element={<CustomerForm />} />
              <Route path="customers/:id/edit" element={<CustomerForm />} />
              
              <Route path="admin" element={<AdminDashboard />} />

              <Route path="*" element={<div>Not Found</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
