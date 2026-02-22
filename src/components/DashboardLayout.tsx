import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Package,
  Wallet,
  Clock,
  Bell,
  ShoppingCart,
  FileText,
  Store,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  Building2,
  Truck,
  Users,
  AlertTriangle,
  BookOpen,
  Settings,
  ShoppingBag,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const pharmacyNav: NavItem[] = [
  {
    label: "Dashboard",
    path: "/pharmacy",
    icon: <LayoutDashboard className='h-4 w-4' />
  },
  {
    label: "Inventory",
    path: "/pharmacy/inventory",
    icon: <Package className='h-4 w-4' />
  },
  {
    label: "Point of Sale",
    path: "/pharmacy/pos",
    icon: <ShoppingBag className='h-4 w-4' />
  },
  {
    label: "Marketplace",
    path: "/pharmacy/marketplace",
    icon: <ShoppingCart className='h-4 w-4' />
  },
  {
    label: "Orders",
    path: "/pharmacy/orders",
    icon: <History className='h-4 w-4' />
  },
  {
    label: "Expiry Tracker",
    path: "/pharmacy/expiry",
    icon: <Clock className='h-4 w-4' />
  },
  {
    label: "Wallet",
    path: "/pharmacy/wallet",
    icon: <Wallet className='h-4 w-4' />
  },
  {
    label: "Notifications",
    path: "/pharmacy/notifications",
    icon: <Bell className='h-4 w-4' />
  },
  {
    label: "Documents",
    path: "/pharmacy/documents",
    icon: <FileText className='h-4 w-4' />
  },
  {
    label: "Profile",
    path: "/pharmacy/profile",
    icon: <Settings className='h-4 w-4' />
  }
];

const vendorNav: NavItem[] = [
  {
    label: "Dashboard",
    path: "/vendor",
    icon: <LayoutDashboard className='h-4 w-4' />
  },
  {
    label: "Products",
    path: "/vendor/products",
    icon: <Store className='h-4 w-4' />
  },
  {
    label: "Orders",
    path: "/vendor/orders",
    icon: <ClipboardList className='h-4 w-4' />
  },
  {
    label: "Verification",
    path: "/vendor/verification",
    icon: <ShieldCheck className='h-4 w-4' />
  },
  {
    label: "Notifications",
    path: "/vendor/notifications",
    icon: <Bell className='h-4 w-4' />
  },
  {
    label: "Profile",
    path: "/vendor/profile",
    icon: <Settings className='h-4 w-4' />
  }
];

const adminNav: NavItem[] = [
  {
    label: "Overview",
    path: "/admin",
    icon: <BarChart3 className='h-4 w-4' />
  },
  {
    label: "Pharmacies",
    path: "/admin/pharmacies",
    icon: <Building2 className='h-4 w-4' />
  },
  {
    label: "Vendors",
    path: "/admin/vendors",
    icon: <Users className='h-4 w-4' />
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: <Truck className='h-4 w-4' />
  },
  {
    label: "Buy-Back",
    path: "/admin/buyback",
    icon: <Clock className='h-4 w-4' />
  },
  {
    label: "Disputes",
    path: "/admin/disputes",
    icon: <AlertTriangle className='h-4 w-4' />
  },
  {
    label: "Audit Log",
    path: "/admin/audit",
    icon: <BookOpen className='h-4 w-4' />
  },
  {
    label: "Settings",
    path: "/admin/settings",
    icon: <Settings className='h-4 w-4' />
  }
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { appUser, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems =
    appUser?.role === "pharmacy"
      ? pharmacyNav
      : appUser?.role === "vendor"
        ? vendorNav
        : adminNav;

  const roleLabel =
    appUser?.role === "pharmacy"
      ? `${appUser?.name ?? "Pharmacy"} Pharmacy Portal`
      : appUser?.role === "vendor"
        ? `${appUser?.name ?? "Vendor"} Vendor Portal`
        : `${appUser?.name ?? "Admin"}`;

  return (
    <div className='flex h-screen overflow-hidden bg-muted/30'>
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-40 bg-foreground/20 lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className='flex h-16 items-center gap-2 px-4 border-b border-sidebar-border'>
          <img
            src='/logo-white.png'
            alt='PharmaLink'
            className='h-6 w-6 text-sidebar-primary'
          />
          <span className='text-lg font-bold'>PharmaLink</span>
          <Button
            variant='ghost'
            size='icon'
            className='ml-auto lg:hidden text-sidebar-foreground'
            onClick={() => setSidebarOpen(false)}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <div className='px-4 py-3'>
          <Badge
            variant='secondary'
            className='bg-sidebar-accent text-sidebar-accent-foreground text-xs'
          >
            {roleLabel}
          </Badge>
        </div>

        <ScrollArea className='flex-1 px-2'>
          <nav className='space-y-1 py-2'>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={
                  item.path === "/pharmacy" ||
                  item.path === "/vendor" ||
                  item.path === "/admin"
                }
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )
                }
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className='border-t border-sidebar-border p-4'>
          <div className='mb-3'>
            <p className='text-sm font-medium truncate'>{appUser?.name}</p>
            <p className='text-xs text-sidebar-foreground/60 truncate'>
              {appUser?.email}
            </p>
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground'
            onClick={signOut}
          >
            <LogOut className='mr-2 h-4 w-4' />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className='flex flex-1 flex-col overflow-hidden'>
        <header className='flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6'>
          <Button
            variant='ghost'
            size='icon'
            className='lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='h-5 w-5' />
          </Button>
          <h2 className='text-lg font-semibold'>
            {navItems.find(
              (n) =>
                location.pathname === n.path ||
                (n.path !== "/" && location.pathname.startsWith(n.path + "/"))
            )?.label || "Dashboard"}
          </h2>
        </header>
        <main className='flex-1 overflow-auto p-4 lg:p-6'>{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
