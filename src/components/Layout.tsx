import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      {/* overflow-anchor:none evita microajustes de scroll en Chrome cuando el árbol React se repinta */}
      <main className="pb-20 md:pb-8 overflow-x-hidden [overflow-anchor:none]">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
