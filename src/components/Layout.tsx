import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="min-h-dvh min-h-screen bg-background text-foreground">
      <Header />
      {/* overflow-x-clip evita scroll horizontal sin romper position:sticky (a diferencia de hidden) */}
      <main className="pb-20 md:pb-8 overflow-x-clip">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
