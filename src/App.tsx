import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";
import Search from "./pages/Search";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Curso from "./pages/Curso";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AuthRedirectRoute from "./components/AuthRedirectRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Admin from "./pages/Admin";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Cambiamos a "system" para detectar automáticamente el tema del dispositivo */}
    <ThemeProvider defaultTheme="system" storageKey="epefi-edu-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          {/* Envolvemos toda la aplicación con AuthProvider */}
          <AuthProvider>
            <Routes>
              {/* Rutas de autenticación - SIN Layout */}
              <Route element={<AuthRedirectRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Register />} />
                <Route
                  path="/recuperar-contrasena"
                  element={<ForgotPassword />}
                />
              </Route>

              {/* Rutas protegidas - CON Layout */}
              <Route element={<Layout />}>
                <Route element={<ProtectedRoute />}>
                  {/* Rutas originales de EPEFI - ahora protegidas */}
                  <Route path="/" element={<Index />} />
                  <Route path="/curso" element={<Curso />} />
                  <Route path="/curso/:courseId" element={<Curso />} />
                  <Route path="/search" element={<Search />} />
                  {/* Nueva ruta de perfil */}
                  <Route path="/profile" element={<Profile />} />
                </Route>
                {/* Rutas de administración - Solo para admins */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
