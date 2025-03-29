import { useState } from "react";
import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: string;
};

const MOBILE_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: "dashboard" },
  { title: "Expenses", href: "/expenses", icon: "receipt_long" },
  { title: "Budget", href: "/budget", icon: "account_balance_wallet" },
  { title: "Community", href: "/community", icon: "people" },
];

export function Navbar({ title }: { title: string }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden bg-primary text-white sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white focus:outline-none"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-medium">FinanceHub</h1>
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-white focus:outline-none">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4 ml-64">
          <h2 className="text-xl font-medium text-gray-700">{title}</h2>
          <div className="flex items-center">
            <div className="relative mr-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary transition-all">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
          <Sidebar />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white shadow-lg border-t fixed bottom-0 left-0 right-0 z-10">
        <div className="flex justify-around">
          {MOBILE_NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex flex-col items-center py-2 px-3",
                location === item.href ? "text-primary" : "text-gray-400"
              )}>
                <span className="material-icons">{item.icon}</span>
                <span className="text-xs mt-1">{item.title}</span>
              </a>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
