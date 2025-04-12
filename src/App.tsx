
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Owner Routes
import OwnerDashboard from "./pages/owner/Dashboard";
import StoresPage from "./pages/owner/Stores";
import UsersPage from "./pages/owner/Users";
import OwnerSalesPage from "./pages/owner/Sales";
import OwnerSaleDetail from "./pages/owner/SaleDetail";
import OwnerNewSale from "./pages/owner/NewSale";
import ProductsPage from "./pages/owner/Products";
import CustomersPage from "./pages/owner/Customers";
import StockManagement from "./pages/owner/StockManagement";

// Vendor Routes
import VendorDashboard from "./pages/vendor/Dashboard";
import SalesList from "./pages/vendor/SalesList";
import SaleDetail from "./pages/vendor/SaleDetail";
import NewSale from "./pages/vendor/NewSale";
import RepairsList from "./pages/vendor/RepairsList";
import RepairDetail from "./pages/vendor/RepairDetail";

// Repairer Routes
import RepairerDashboard from "./pages/repairer/Dashboard";

const queryClient = new QueryClient();

// ProtectedRoute component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    </div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to the appropriate dashboard based on role
    if (currentUser.role === 'owner') {
      return <Navigate to="/dashboard" replace />;
    } else if (currentUser.role === 'vendor') {
      return <Navigate to="/vendor/dashboard" replace />;
    } else if (currentUser.role === 'repairer') {
      return <Navigate to="/repairer/dashboard" replace />;
    }
    
    // Fallback
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              
              {/* Owner routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/stores" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <StoresPage />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="/sales" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerSalesPage />
                </ProtectedRoute>
              } />
              <Route path="/sales/:id" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerSaleDetail />
                </ProtectedRoute>
              } />
              <Route path="/sales/new" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerNewSale />
                </ProtectedRoute>
              } />
              <Route path="/products" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <ProductsPage />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <CustomersPage />
                </ProtectedRoute>
              } />
              <Route path="/stock" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <StockManagement />
                </ProtectedRoute>
              } />
              
              {/* Vendor routes */}
              <Route path="/vendor/dashboard" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/vendor/sales" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <SalesList />
                </ProtectedRoute>
              } />
              <Route path="/vendor/sales/new" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <NewSale />
                </ProtectedRoute>
              } />
              <Route path="/vendor/sales/:id" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <SaleDetail />
                </ProtectedRoute>
              } />
              <Route path="/vendor/customers" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <CustomersPage />
                </ProtectedRoute>
              } />
              <Route path="/vendor/repairs" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <RepairsList />
                </ProtectedRoute>
              } />
              <Route path="/vendor/repairs/:id" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <RepairDetail />
                </ProtectedRoute>
              } />
              <Route path="/vendor/notifications" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <div>Page des notifications vendeur en construction</div>
                </ProtectedRoute>
              } />
              
              {/* Repairer routes */}
              <Route path="/repairer/dashboard" element={
                <ProtectedRoute allowedRoles={['repairer']}>
                  <RepairerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/repairer/repairs" element={
                <ProtectedRoute allowedRoles={['repairer']}>
                  <div>Page des réparations à effectuer en construction</div>
                </ProtectedRoute>
              } />
              <Route path="/repairer/schedule" element={
                <ProtectedRoute allowedRoles={['repairer']}>
                  <div>Page de planning réparateur en construction</div>
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
