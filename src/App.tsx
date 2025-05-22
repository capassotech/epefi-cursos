
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fitness-edu-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/curso" element={<Curso />} />
              <Route path="/classes" element={<Classes />} />
              <Route path="/classes/:moduleId/:classId" element={<ClassDetail />} />
              <Route path="/theory" element={<Theory />} />
              <Route path="/theory/:unitId" element={<TheoryDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
