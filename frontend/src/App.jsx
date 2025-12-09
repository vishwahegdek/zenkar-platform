import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import OrdersList from './pages/OrdersList';
import OrderForm from './pages/OrderForm';
import ProductsList from './pages/ProductsList';
import ProductForm from './pages/ProductForm';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/orders" replace />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/new" element={<OrderForm />} />
            <Route path="orders/:id/edit" element={<OrderForm />} />
            
            <Route path="products" element={<ProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            
            <Route path="*" element={<div>Not Found</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
