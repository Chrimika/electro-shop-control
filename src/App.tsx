
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { useAuth } from "./contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Owner Routes
import OwnerDashboard from "./pages/owner/Dashboard";

// Vendor Routes
import VendorDashboard from "./pages/vendor/Dashboard";

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
              <Route path="/" element={<Landing />} />
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
                  <div>Stores Page</div>
                </ProtectedRoute>
              } />
              <Route path="/sales" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <div>Sales Page</div>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <div>Users Management Page</div>
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
                  <div>Vendor Sales Page</div>
                </ProtectedRoute>
              } />
              <Route path="/vendor/customers" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <div>Vendor Customers Page</div>
                </ProtectedRoute>
              } />
              <Route path="/vendor/repairs" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <div>Vendor Repairs Page</div>
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
                  <div>Repairer Repairs Page</div>
                </ProtectedRoute>
              } />
              <Route path="/repairer/schedule" element={
                <ProtectedRoute allowedRoles={['repairer']}>
                  <div>Repairer Schedule Page</div>
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
