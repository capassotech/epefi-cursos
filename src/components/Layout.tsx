
import { useState } from "react";
import BottomNavigation from "./BottomNavigation";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900">
      <Header />
      <main className="pb-20 md:pb-8">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
