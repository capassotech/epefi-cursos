
import BottomNavigation from "./BottomNavigation";
import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pb-20 md:pb-8">
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
