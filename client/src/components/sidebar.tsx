import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { LogOut, User } from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/", icon: "dashboard" },
  { title: "Expenses", href: "/expenses", icon: "receipt_long" },
  { title: "Budget", href: "/budget", icon: "account_balance_wallet" },
  { title: "Community", href: "/community", icon: "people" },
  { title: "Settings", href: "/settings", icon: "settings" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="bg-white shadow-md flex flex-col w-64 fixed inset-y-0 left-0 z-10 transform transition-transform duration-300 ease-in-out">
      <div className="p-4 bg-primary text-white">
        <h1 className="text-xl font-medium">FinanceHub</h1>
        <p className="text-sm opacity-80">For International Students</p>
      </div>
      <div className="flex flex-col flex-grow p-4 overflow-y-auto">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
              <User size={20} />
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-700">{user?.fullName || user?.username}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="mb-1">
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100 transition-all group",
                      location === item.href && "bg-gray-100"
                    )}
                  >
                    <span
                      className={cn(
                        "material-icons",
                        location === item.href ? "text-primary" : "text-gray-400 group-hover:text-primary"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={cn(
                        "ml-3",
                        location === item.href && "font-medium"
                      )}
                    >
                      {item.title}
                    </span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center p-3 text-gray-700 rounded-md hover:bg-gray-100 transition-all group w-full text-left"
          >
            <LogOut className="text-gray-400 group-hover:text-primary h-5 w-5" />
            <span className="ml-3">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
