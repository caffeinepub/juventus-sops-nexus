import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Circle, Clock, Package } from "lucide-react";
import type { OrderType } from "../backend.d";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const ORDER_STEPS = ["Pending", "Processing", "Completed"];

function getStepIndex(status: string): number {
  if (status === "completed") return 2;
  if (status === "processing") return 1;
  return 0;
}

function OrderStepper({ status }: { status: string }) {
  const currentStep = getStepIndex(status);
  if (status === "cancelled") {
    return (
      <div className="text-xs text-red-400 flex items-center gap-1.5 mt-3">
        <Circle className="w-3 h-3" /> Order cancelled
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0 mt-4" aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-accent border-accent"
                    : active
                      ? "bg-primary border-primary"
                      : "bg-transparent border-muted"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-3.5 h-3.5 text-accent-foreground" />
                ) : active ? (
                  <Clock className="w-3 h-3 text-white" />
                ) : (
                  <Circle className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <span
                className={`text-xs mt-1 whitespace-nowrap ${
                  done
                    ? "text-accent"
                    : active
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </div>
            {i < ORDER_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 rounded transition-all ${
                  done ? "bg-accent" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { identity, login } = useInternetIdentity();
  const { actor } = useActor();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: orders = [], isLoading } = useQuery<OrderType[]>({
    queryKey: ["orders", identity?.getPrincipal().toString()],
    queryFn: () => actor?.getOrders() ?? Promise.resolve([]),
    enabled: !!actor && isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view orders</h2>
          <Button
            onClick={login}
            className="bg-primary hover:bg-primary/80"
            data-ocid="orders.login.button"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4" data-ocid="orders.loading_state">
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20" data-ocid="orders.empty_state">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet.
            </p>
            <Button
              asChild
              variant="outline"
              data-ocid="orders.shop_now.button"
            >
              <Link to="/products" search={{}}>
                Start Shopping <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <Card
                key={String(order.id)}
                className="border-border bg-card"
                data-ocid={`orders.item.${i + 1}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">Order #{String(order.id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          Number(order.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={STATUS_COLORS[order.status] || ""}
                      variant="secondary"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm">
                      {order.items.map((item) => item.product.name).join(", ")}
                    </p>
                    <p className="font-bold text-accent">
                      ${(Number(order.totalAmount) / 100).toFixed(2)}
                    </p>
                  </div>
                  <OrderStepper status={order.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
