import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LogOut, Settings, ShoppingCart, User, Zap } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function NavLink({
  to,
  search,
  children,
  ocid,
}: {
  to: string;
  search?: Record<string, string>;
  children: React.ReactNode;
  ocid: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      search={search ?? {}}
      className={`relative text-sm transition-colors pb-0.5 ${
        isActive
          ? "text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground"
      }`}
      data-ocid={ocid}
    >
      {children}
      <span
        className={`absolute bottom-0 left-0 h-0.5 rounded-full bg-primary transition-all duration-300 ${
          isActive ? "w-full" : "w-0"
        }`}
      />
    </Link>
  );
}

export default function Navbar() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { actor } = useActor();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: cartItems = [] } = useQuery({
    queryKey: ["cart", identity?.getPrincipal().toString()],
    queryFn: () => actor?.getCart() ?? Promise.resolve([]),
    enabled: !!actor && isAuthenticated,
  });

  const { data: isAdmin = false } = useQuery({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: () => actor?.isCallerAdmin() ?? Promise.resolve(false),
    enabled: !!actor && isAuthenticated,
  });

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
            data-ocid="nav.logo.link"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg glow-purple text-primary hidden sm:block md:hidden">
              JS Nexus
            </span>
            <span className="font-bold text-lg glow-purple text-primary hidden md:block">
              Juventus Sops Nexus
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink to="/" ocid="nav.home.link">
              Home
            </NavLink>
            <NavLink to="/products" search={{}} ocid="nav.products.link">
              Products
            </NavLink>
            <NavLink to="/services" search={{}} ocid="nav.services.link">
              Services
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" ocid="nav.admin.link">
                Admin
              </NavLink>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => navigate({ to: "/cart" })}
                data-ocid="nav.cart.button"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full text-xs flex items-center justify-center text-white">
                    {cartCount}
                  </span>
                )}
              </Button>
            )}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    data-ocid="nav.user.button"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:block text-xs">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/orders" })}
                    data-ocid="nav.orders.link"
                  >
                    My Orders
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate({ to: "/admin" })}
                      data-ocid="nav.admin.dropdown.link"
                    >
                      <Settings className="w-4 h-4 mr-2" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={clear}
                    data-ocid="nav.logout.button"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                onClick={login}
                disabled={isLoggingIn}
                className="bg-primary hover:bg-primary/80"
                data-ocid="nav.login.button"
              >
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            )}

            {/* Mobile menu toggle - lines stacked vertically */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden px-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-ocid="nav.mobile.menu.button"
            >
              <span className="sr-only">Menu</span>
              <div className="flex flex-col justify-center gap-1.5 w-5">
                <span className="block w-5 h-0.5 bg-foreground rounded-full" />
                <span className="block w-5 h-0.5 bg-foreground rounded-full" />
                <span className="block w-5 h-0.5 bg-foreground rounded-full" />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-border flex flex-col gap-2">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="px-2 py-1.5 text-sm hover:text-primary"
              data-ocid="nav.mobile.home.link"
            >
              Home
            </Link>
            <Link
              to="/products"
              search={{}}
              onClick={() => setMobileOpen(false)}
              className="px-2 py-1.5 text-sm hover:text-primary"
              data-ocid="nav.mobile.products.link"
            >
              Products
            </Link>
            <Link
              to="/services"
              search={{}}
              onClick={() => setMobileOpen(false)}
              className="px-2 py-1.5 text-sm hover:text-primary"
              data-ocid="nav.mobile.services.link"
            >
              Services
            </Link>
            {isAuthenticated && (
              <Link
                to="/cart"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-1.5 text-sm hover:text-primary"
                data-ocid="nav.mobile.cart.link"
              >
                Cart ({cartCount})
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="px-2 py-1.5 text-sm text-accent hover:text-accent/80"
                data-ocid="nav.mobile.admin.link"
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
