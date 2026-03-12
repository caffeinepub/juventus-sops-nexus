import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  Bot,
  Building2,
  Coins,
  Palette,
  Send,
  Store,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { Service } from "../backend.d";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const SERVICE_CATEGORIES = [
  "Graphics & Web Design",
  "CAC & SCUML Registration",
  "Chatbot Development",
  "Mini WebStore Creation",
  "Social Media Growth",
  "Token Creation & Minting",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Graphics & Web Design": Palette,
  "CAC & SCUML Registration": Building2,
  "Chatbot Development": Bot,
  "Mini WebStore Creation": Store,
  "Social Media Growth": TrendingUp,
  "Token Creation & Minting": Coins,
};

export default function ServicesPage() {
  const search = useSearch({ from: "/services" });
  const navigate = useNavigate();
  const activeCategory = search.category || "All";
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => actor?.getServices() ?? Promise.resolve([]),
    enabled: !!actor,
  });

  const filteredServices =
    activeCategory === "All"
      ? services
      : services.filter((s) => s.category === activeCategory);

  const handleRequestService = (service: Service) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to request a service");
      return;
    }
    navigate({
      to: "/service-request",
      search: { serviceName: service.name, serviceId: service.id },
    });
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Digital Services</h1>
        <p className="text-muted-foreground mb-8">
          Professional solutions crafted for your business growth
        </p>

        {/* Category Tabs */}
        <div
          className="flex flex-wrap gap-2 mb-8"
          data-ocid="services.category.tab"
        >
          {["All", ...SERVICE_CATEGORIES].map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => {
                if (cat === "All") {
                  navigate({ to: "/services", search: {} });
                } else {
                  navigate({ to: "/services", search: { category: cat } });
                }
              }}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                activeCategory === cat
                  ? "bg-accent text-background shadow-lg"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`services.tab.${cat.toLowerCase().replace(/[^a-z0-9]/g, "_")}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-ocid="services.loading_state"
          >
            {["a", "b", "c", "d", "e", "f"].map((k) => (
              <Skeleton key={k} className="h-52 rounded-xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div
            className="text-center py-20 text-muted-foreground"
            data-ocid="services.empty_state"
          >
            <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No services in this category yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, i) => {
              const Icon = CATEGORY_ICONS[service.category] || Palette;
              return (
                <Card
                  key={String(service.id)}
                  className="card-glow border-border bg-card flex flex-col"
                  data-ocid={`services.item.${i + 1}`}
                >
                  <CardContent className="p-5 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <Badge variant="secondary" className="text-xs mb-2">
                      {service.category}
                    </Badge>
                    <h3 className="font-semibold text-foreground mb-1">
                      {service.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {service.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 flex items-center justify-between">
                    <span className="text-primary font-semibold text-sm">
                      {service.priceLabel}
                    </span>
                    <Button
                      size="sm"
                      className="bg-accent text-background hover:bg-accent/80"
                      onClick={() => handleRequestService(service)}
                      data-ocid={`services.request.button.${i + 1}`}
                    >
                      Request Service
                    </Button>
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
