import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import HowItWorks from "./pages/HowItWorks";
import AboutUs from "./pages/AboutUs";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Support from "./pages/Support";
import Calculator from "./pages/Calculator";
import LoanApplication from "./pages/LoanApplication";
import DocumentVerification from "./pages/DocumentVerification";
import ApplicationResult from "./pages/ApplicationResult";
import Profile from "./pages/Profile";
import LoanOfficerDashboard from "./pages/LoanOfficerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ApplicationDetail from "./pages/ApplicationDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/layout/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Main routes with layout */}
          <Route
            path="/*"
            element={
              <>
                <Header />
                <main className="min-h-screen">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/apply" element={<LoanApplication />} />
                    <Route
                      path="/documents/:appId"
                      element={<DocumentVerification />}
                    />
                    <Route
                      path="/result/:appId"
                      element={<ApplicationResult />}
                    />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/officer" element={<LoanOfficerDashboard />} />
                    <Route
                      path="/officer/application/:appId"
                      element={<ApplicationDetail />}
                    />
                    <Route path="/admin" element={<AdminDashboard />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
