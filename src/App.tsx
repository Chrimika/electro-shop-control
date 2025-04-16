
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import OwnerDashboard from './pages/owner/Dashboard';
import VendorDashboard from './pages/vendor/Dashboard';
import OwnerStores from './pages/owner/Stores';
import OwnerNewStore from './pages/owner/NewStore';
import OwnerStoreDetail from './pages/owner/StoreDetail';
import OwnerSales from './pages/owner/Sales';
import OwnerNewSale from './pages/owner/NewSale';
import VendorSales from './pages/vendor/Sales';
import VendorSaleDetail from './pages/vendor/SaleDetail';
import VendorProfile from './pages/vendor/Profile';
import OwnerCustomers from './pages/owner/Customers';
import OwnerNewCustomer from './pages/owner/NewCustomer';
import OwnerCustomerDetail from './pages/owner/CustomerDetail';
import CompanySetup from "./pages/owner/CompanySetup";
import OwnerReceiptVerification from "./pages/owner/ReceiptVerification";
import ReceiptVerification from "./pages/vendor/ReceiptVerification";

function App() {
  const { currentUser } = useAuth();

  useEffect(() => {
    document.title = 'ElectroShop';
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/forgot-password" element={<Auth />} />

        {/* Owner Routes */}
        <Route
          path="/owner/dashboard"
          element={currentUser?.role === 'owner' ? <OwnerDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/owner/stores"
          element={currentUser?.role === 'owner' ? <OwnerStores /> : <Navigate to="/login" />}
        />
        <Route
          path="/owner/stores/new"
          element={currentUser?.role === 'owner' ? <OwnerNewStore /> : <Navigate to="/login" />}
        />
        <Route
          path="/owner/stores/:id"
          element={currentUser?.role === 'owner' ? <OwnerStoreDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/owner/sales"
          element={currentUser?.role === 'owner' ? <OwnerSales /> : <Navigate to="/login" />}
        />
        <Route
          path="/owner/sales/new"
          element={currentUser?.role === 'owner' ? <OwnerNewSale /> : <Navigate to="/login" />}
        />
        <Route path="/owner/setup" element={<CompanySetup />} />
        <Route path="/owner/receipt-verification" element={<OwnerReceiptVerification />} />
        <Route
          path="/owner/customers"
          element={currentUser?.role === 'owner' ? <OwnerCustomers /> : <Navigate to="/login" />}
        />
        <Route
          path="/owner/customers/new"
          element={currentUser?.role === 'owner' ? <OwnerNewCustomer /> : <Navigate to="/login" />}
        />
         <Route
          path="/owner/customers/:id"
          element={currentUser?.role === 'owner' ? <OwnerCustomerDetail /> : <Navigate to="/login" />}
        />

        {/* Vendor Routes */}
        <Route
          path="/vendor/dashboard"
          element={currentUser?.role === 'vendor' ? <VendorDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/vendor/sales"
          element={currentUser?.role === 'vendor' ? <VendorSales /> : <Navigate to="/login" />}
        />
        <Route
          path="/vendor/sales/:id"
          element={currentUser?.role === 'vendor' ? <VendorSaleDetail /> : <Navigate to="/login" />}
        />
         <Route
          path="/vendor/profile"
          element={currentUser?.role === 'vendor' ? <VendorProfile /> : <Navigate to="/login" />}
        />
        
        <Route path="/vendor/receipt-verification" element={<ReceiptVerification />} />

        {/* Redirect authenticated users */}
        <Route
          path="/"
          element={
            currentUser ? (
              currentUser.role === 'owner' ? (
                <Navigate to="/owner/dashboard" />
              ) : (
                <Navigate to="/vendor/dashboard" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
