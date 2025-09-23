import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";
import Classes from "./pages/Classes";
import Theory from "./pages/Theory";
import Search from "./pages/Search";
import TheoryDetail from "./pages/TheoryDetail";
import ClassDetail from "./pages/ClassDetail";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Curso from "./pages/Curso";
// Nuevas importaciones para la estructura de INEE
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirectRoute from "./components/AuthRedirectRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Mantenemos el tema oscuro de EPEFI pero cambiamos el storageKey */}
    <ThemeProvider defaultTheme="dark" storageKey="epefi-edu-theme">
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
                  <Route path="/classes" element={<Classes />} />
                  <Route
                    path="/classes/:moduleId/:classId"
                    element={<ClassDetail />}
                  />
                  <Route path="/theory" element={<Theory />} />
                  <Route path="/theory/:unitId" element={<TheoryDetail />} />
                  <Route path="/search" element={<Search />} />
                  {/* Nueva ruta de perfil */}
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
