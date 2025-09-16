import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-20 md:pb-8">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
