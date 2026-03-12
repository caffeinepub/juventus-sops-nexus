import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
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
            <span className="font-bold text-lg glow-purple text-primary hidden sm:block">
              JS Nexus
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.home.link"
            >
              Home
            </Link>
            <Link
              to="/products"
              search={{}}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.products.link"
            >
              Products
            </Link>
            <Link
              to="/services"
              search={{}}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="nav.services.link"
            >
              Services
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm text-accent hover:text-accent/80 transition-colors"
                data-ocid="nav.admin.link"
              >
                Admin
              </Link>
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

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span className="sr-only">Menu</span>
              <div className="w-5 h-0.5 bg-foreground mb-1" />
              <div className="w-5 h-0.5 bg-foreground mb-1" />
              <div className="w-5 h-0.5 bg-foreground" />
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
