import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  Brain,
  GraduationCap,
  Heart,
  Image,
  Lightbulb,
  PenTool,
  Search,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Product } from "../backend.d";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const PRODUCT_CATEGORIES = [
  "AI Prompt Packs",
  "Health Tech Content",
  "eBooks & White Papers",
  "Digital Courses",
  "Health Tips & Educational Content",
  "Ghostwritten Materials",
  "Visual & Multimedia Assets",
  "Kids Storybooks",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "AI Prompt Packs": Brain,
  "Health Tech Content": Heart,
  "eBooks & White Papers": BookOpen,
  "Digital Courses": GraduationCap,
  "Health Tips & Educational Content": Lightbulb,
  "Ghostwritten Materials": PenTool,
  "Visual & Multimedia Assets": Image,
  "Kids Storybooks": BookMarked,
};

export default function ProductsPage() {
  const search = useSearch({ from: "/app/products" });
  const navigate = useNavigate();
  const activeCategory = (search as { category?: string }).category || "All";
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", activeCategory],
    queryFn: () =>
      actor?.getProducts(activeCategory === "All" ? null : activeCategory) ??
      Promise.resolve([]),
    enabled: !!actor,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.addToCart(productId, 1);
    },
    onSuccess: () => {
      toast.success("Added to cart!");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: () => toast.error("Failed to add to cart"),
  });

  const handleCategoryChange = (cat: string) => {
    setSearchInput("");
    if (cat === "All") {
      navigate({ to: "/products", search: {} });
    } else {
      navigate({ to: "/products", search: { category: cat } });
    }
  };

  const visibleProducts = products
    .filter((p) => p.isAvailable)
    .filter((p) => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Digital Products</h1>
        <p className="text-muted-foreground mb-6">
          Browse our collection of digital resources and tools
        </p>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            data-ocid="products.search_input"
          />
        </div>

        {/* Category Tabs */}
        <div
          className="flex flex-wrap gap-2 mb-8"
          data-ocid="products.category.tab"
        >
          {["All", ...PRODUCT_CATEGORIES].map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              }`}
              data-ocid={`products.tab.${cat.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            data-ocid="products.loading_state"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
              <Skeleton key={k} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div
            className="text-center py-20 text-muted-foreground"
            data-ocid="products.empty_state"
          >
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">No products found</p>
            <p className="text-sm">
              {debouncedSearch
                ? `No results for "${debouncedSearch}"`
                : "No products in this category yet."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleProducts.map((product, i) => {
              const Icon = CATEGORY_ICONS[product.category] || Brain;
              return (
                <Card
                  key={String(product.id)}
                  className="card-glow border-border bg-card flex flex-col overflow-hidden"
                  data-ocid={`products.item.${i + 1}`}
                >
                  <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                  <CardContent className="p-5 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="font-semibold text-foreground mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {product.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 flex items-center justify-between">
                    <span className="text-accent font-bold">
                      ${(Number(product.price) / 100).toFixed(2)}
                    </span>
                    {isAuthenticated ? (
                      <Button
                        size="sm"
                        onClick={() => addToCartMutation.mutate(product.id)}
                        disabled={addToCartMutation.isPending}
                        className="bg-primary hover:bg-primary/80"
                        data-ocid={`products.add_to_cart.button.${i + 1}`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast.info("Please sign in to add to cart")
                        }
                        data-ocid={`products.signin_to_buy.button.${i + 1}`}
                      >
                        Buy
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
