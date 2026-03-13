import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import { Toaster } from "./components/ui/sonner";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPage from "./pages/AdminPage";
import CartPage from "./pages/CartPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OrdersPage from "./pages/OrdersPage";
import PaymentPage from "./pages/PaymentPage";
import ProductsPage from "./pages/ProductsPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import ServicesPage from "./pages/ServicesPage";

function ScrollToTop() {
  const { pathname } = useLocation();
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers scroll on nav
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="z-50 fixed bottom-6 right-6 w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/80 transition-all hover:scale-110"
      aria-label="Back to top"
      data-ocid="app.back_to_top.button"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  );
}

function AuthSync() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const registeredRef = useRef(false);

  useEffect(() => {
    const isAuthenticated =
      !!identity && !identity.getPrincipal().isAnonymous();
    if (isAuthenticated && actor && !registeredRef.current) {
      registeredRef.current = true;
      actor.registerUser().catch(() => {
        registeredRef.current = false;
      });
    }
    if (!isAuthenticated) {
      registeredRef.current = false;
    }
  }, [identity, actor]);

  return null;
}

// Root route -- wraps everything
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <AuthSync />
      <Outlet />
      <Toaster />
      <BackToTopButton />
    </div>
  ),
});

// Login route -- no navbar, full-screen branded page
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Auth guard + layout with navbar for all protected pages
function AppLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  useEffect(() => {
    // Only redirect after initialization is complete
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  // While initializing, show a minimal loading screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -- will redirect via useEffect, render nothing
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Outlet />
    </div>
  );
}

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  component: HomePage,
});

const productsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/products",
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: (search.category as string | undefined) ?? "",
  }),
  component: ProductsPage,
});

const servicesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/services",
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: (search.category as string | undefined) ?? "",
  }),
  component: ServicesPage,
});

const serviceRequestRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/service-request",
  validateSearch: (
    search: Record<string, unknown>,
  ): { serviceName?: string; serviceId?: bigint } => ({
    serviceName: (search.serviceName as string | undefined) ?? "",
    serviceId: search.serviceId
      ? BigInt(search.serviceId as string)
      : undefined,
  }),
  component: ServiceRequestPage,
});

const cartRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/cart",
  component: CartPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/orders",
  component: OrdersPage,
});

const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin",
  component: AdminPage,
});

export const paymentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/payment",
  validateSearch: (search: Record<string, unknown>): { orderId?: number } => ({
    orderId: search.orderId ? Number(search.orderId) : undefined,
  }),
  component: PaymentPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appLayoutRoute.addChildren([
    homeRoute,
    productsRoute,
    servicesRoute,
    serviceRequestRoute,
    cartRoute,
    ordersRoute,
    adminRoute,
    paymentRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
