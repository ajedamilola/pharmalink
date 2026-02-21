import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OTPVerification from "./pages/OTPVerification";
import DashboardLayout from "./components/DashboardLayout";
import PharmacyDashboard from "./pages/pharmacy/PharmacyDashboard";
import PharmacyInventory from "./pages/pharmacy/PharmacyInventory";
import PharmacyMarketplace from "./pages/pharmacy/PharmacyMarketplace";
import PharmacyExpiry from "./pages/pharmacy/PharmacyExpiry";
import PharmacyWallet from "./pages/pharmacy/PharmacyWallet";
import PharmacyDocuments from "./pages/pharmacy/PharmacyDocuments";
import PharmacyPOS from "./pages/pharmacy/PharmacyPOS";
import PharmacyProductDetail from "./pages/pharmacy/PharmacyProductDetail";
import PharmacyOrders from "./pages/pharmacy/PharmacyOrders";
import Notifications from "./pages/shared/Notifications";
import NotFound from "./pages/NotFound";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorVerification from "./pages/vendor/VendorVerification";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, appUser, loading, otpVerified } = useAuth();
  const prevUserId = useRef<string | null>(null);

  // Clear query cache on user switch to prevent stale data
  useEffect(() => {
    if (appUser?.id !== prevUserId.current) {
      queryClient.clear();
      prevUserId.current = appUser?.id ?? null;
    }
  }, [appUser?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !appUser) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  // Admin requires OTP
  if (appUser.role === 'admin' && !otpVerified) {
    return <OTPVerification />;
  }

  const homeRoute = appUser.role === 'pharmacy' ? '/pharmacy' : appUser.role === 'vendor' ? '/vendor' : '/admin';

  // Determine if current path belongs to the wrong portal
  const rolePrefix = `/${appUser.role === 'pharmacy' ? 'pharmacy' : appUser.role === 'vendor' ? 'vendor' : 'admin'}`;

  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to={homeRoute} replace />} />

        {appUser.role !== 'pharmacy' && <Route path="/pharmacy/*" element={<Navigate to={homeRoute} replace />} />}
        {appUser.role !== 'vendor' && <Route path="/vendor/*" element={<Navigate to={homeRoute} replace />} />}
        {appUser.role !== 'admin' && <Route path="/admin/*" element={<Navigate to={homeRoute} replace />} />}

        {/* Pharmacy routes */}
        <Route path="/pharmacy" element={<PharmacyDashboard />} />
        <Route path="/pharmacy/inventory" element={<PharmacyInventory />} />
        <Route path="/pharmacy/inventory/:itemId" element={<PharmacyProductDetail />} />
        <Route path="/pharmacy/marketplace" element={<PharmacyMarketplace />} />
        <Route path="/pharmacy/expiry" element={<PharmacyExpiry />} />
        <Route path="/pharmacy/wallet" element={<PharmacyWallet />} />
        <Route path="/pharmacy/pos" element={<PharmacyPOS />} />
        <Route path="/pharmacy/orders" element={<PharmacyOrders />} />
        <Route path="/pharmacy/notifications" element={<Notifications />} />
        <Route path="/pharmacy/documents" element={<PharmacyDocuments />} />

        {/* Vendor routes */}
        <Route path="/vendor" element={<VendorDashboard />} />
        <Route path="/vendor/products" element={<VendorProducts />} />
        <Route path="/vendor/orders" element={<VendorOrders />} />
        <Route path="/vendor/verification" element={<VendorVerification />} />
        <Route path="/vendor/notifications" element={<Notifications />} />


        <Route path="*" element={<NotFound />} />
      </Routes>
    </DashboardLayout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
