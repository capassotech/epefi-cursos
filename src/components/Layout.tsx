import { Outlet } from "react-router-dom";
import BottomNavigation from "./BottomNavigation";
import Header from "./Header";

const Layout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-24 pt-4 sm:px-6 md:pb-12 md:pt-6">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
