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
import ExpensesBook from './pages/ExpensesBook';
import ExpenseForm from './pages/ExpenseForm';
import ManageExpenses from './pages/ManageExpenses';
import ContactsManager from './pages/ContactsManager';
import LabourLayout from './pages/Labour/LabourLayout';
import LabourEntry from './pages/Labour/LabourEntry';
import LabourManage from './pages/Labour/LabourManage';
import LabourReport from './pages/Labour/LabourReport';
import QuickSale from './pages/QuickSale';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

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
        <ErrorBoundary>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }>
              <Route index element={<OrdersList />} />
              <Route path="dashboard" element={<Dashboard />} />
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
              


              <Route path="expenses" element={<ExpensesBook />} />
              <Route path="expenses/new" element={<ExpenseForm />} />
              <Route path="expenses/manage" element={<ManageExpenses />} />



              <Route path="contacts" element={<ContactsManager />} />
              
              <Route path="labour" element={<LabourLayout />}>
                <Route index element={<Navigate to="daily" replace />} />
                <Route path="daily" element={<LabourEntry />} />
                <Route path="manage" element={<LabourManage />} />
                <Route path="report" element={<LabourReport />} />
              </Route>
              
              <Route path="admin" element={<AdminDashboard />} />

              <Route path="*" element={<div>Not Found</div>} />
            </Route>
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
