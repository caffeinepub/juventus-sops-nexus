import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Navbar from "./components/Navbar";
import { Toaster } from "./components/ui/sonner";
import AdminPage from "./pages/AdminPage";
import CartPage from "./pages/CartPage";
import HomePage from "./pages/HomePage";
import OrdersPage from "./pages/OrdersPage";
import PaymentPage from "./pages/PaymentPage";
import ProductsPage from "./pages/ProductsPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import ServicesPage from "./pages/ServicesPage";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Outlet />
      <Toaster />
    </div>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: (search.category as string | undefined) ?? "",
  }),
  component: ProductsPage,
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  validateSearch: (search: Record<string, unknown>): { category?: string } => ({
    category: (search.category as string | undefined) ?? "",
  }),
  component: ServicesPage,
});

const serviceRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
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
  getParentRoute: () => rootRoute,
  path: "/cart",
  component: CartPage,
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

export const paymentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/payment",
  validateSearch: (search: Record<string, unknown>): { orderId?: number } => ({
    orderId: search.orderId ? Number(search.orderId) : undefined,
  }),
  component: PaymentPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  productsRoute,
  servicesRoute,
  serviceRequestRoute,
  cartRoute,
  ordersRoute,
  adminRoute,
  paymentRoute,
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
