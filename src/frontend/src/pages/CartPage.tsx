import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CartItem } from "../backend.d";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function CartPage() {
  const { identity, login } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ["cart", identity?.getPrincipal().toString()],
    queryFn: () => actor?.getCart() ?? Promise.resolve([]),
    enabled: !!actor && isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: { productId: bigint; quantity: number }) => {
      if (!actor) throw new Error();
      if (quantity <= 0) await actor.removeFromCart(productId);
      else await actor.updateCartItem(productId, quantity);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: () => toast.error("Failed to update cart"),
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error();
      await actor.placeOrder();
    },
    onSuccess: () => {
      toast.success("Order placed successfully!");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("Failed to place order"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your cart</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access your cart.
          </p>
          <Button
            onClick={login}
            className="bg-primary hover:bg-primary/80"
            data-ocid="cart.login.button"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {isLoading ? (
          <div
            className="text-center py-20 text-muted-foreground"
            data-ocid="cart.loading_state"
          >
            Loading cart...
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-20" data-ocid="cart.empty_state">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground mb-6">Your cart is empty.</p>
            <Button asChild variant="outline" data-ocid="cart.shop_now.button">
              <Link to="/products" search={{}}>
                Browse Products <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, i) => (
                <Card
                  key={String(item.product.id)}
                  className="border-border bg-card"
                  data-ocid={`cart.item.${i + 1}`}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.product.category}
                      </p>
                      <p className="text-accent font-semibold">
                        ${(Number(item.product.price) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() =>
                          updateMutation.mutate({
                            productId: item.product.id,
                            quantity: item.quantity - 1,
                          })
                        }
                        data-ocid={`cart.decrease.button.${i + 1}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() =>
                          updateMutation.mutate({
                            productId: item.product.id,
                            quantity: item.quantity + 1,
                          })
                        }
                        data-ocid={`cart.increase.button.${i + 1}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                        onClick={() =>
                          updateMutation.mutate({
                            productId: item.product.id,
                            quantity: 0,
                          })
                        }
                        data-ocid={`cart.remove.button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <div>
              <Card className="border-border bg-card sticky top-24">
                <CardContent className="p-6">
                  <h2 className="font-bold text-lg mb-4">Order Summary</h2>
                  <div className="space-y-2 mb-4">
                    {cartItems.map((item) => (
                      <div
                        key={String(item.product.id)}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground truncate mr-2">
                          {item.product.name} x{item.quantity}
                        </span>
                        <span>
                          $
                          {(
                            (Number(item.product.price) / 100) *
                            item.quantity
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between font-bold mb-6">
                    <span>Total</span>
                    <span className="text-accent">
                      ${(subtotal / 100).toFixed(2)}
                    </span>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/80"
                    onClick={() => placeOrderMutation.mutate()}
                    disabled={placeOrderMutation.isPending}
                    data-ocid="cart.place_order.button"
                  >
                    {placeOrderMutation.isPending
                      ? "Placing Order..."
                      : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
