import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Bot,
  Building2,
  Coins,
  Palette,
  Send,
  Store,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import type { Service } from "../backend.d";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>(
    searchParams.get("category") || "All",
  );
  const [inquireService, setInquireService] = useState<Service | null>(null);
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => actor?.getServices() ?? Promise.resolve([]),
    enabled: !!actor,
  });

  const inquiryMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !inquireService) throw new Error("Not connected");
      await actor.submitInquiry(inquireService.id, message, contactEmail);
    },
    onSuccess: () => {
      toast.success("Inquiry submitted! We'll get back to you soon.");
      setInquireService(null);
      setMessage("");
      setContactEmail("");
    },
    onError: () => toast.error("Failed to submit inquiry"),
  });

  const filteredServices =
    activeCategory === "All"
      ? services
      : services.filter((s) => s.category === activeCategory);

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
                setActiveCategory(cat);
                cat === "All"
                  ? setSearchParams({})
                  : setSearchParams({ category: cat });
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
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast.info("Please sign in to inquire");
                          return;
                        }
                        setInquireService(service);
                      }}
                      data-ocid={`services.inquire.button.${i + 1}`}
                    >
                      Inquire
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Inquiry Dialog */}
      <Dialog
        open={!!inquireService}
        onOpenChange={(open) => !open && setInquireService(null)}
      >
        <DialogContent data-ocid="inquiry.dialog">
          <DialogHeader>
            <DialogTitle>Inquire about {inquireService?.name}</DialogTitle>
            <DialogDescription>
              Tell us more about your needs and we'll get back to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="inq-email">Contact Email</Label>
              <Input
                id="inq-email"
                type="email"
                placeholder="your@email.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                data-ocid="inquiry.email.input"
              />
            </div>
            <div>
              <Label htmlFor="inq-message">Message</Label>
              <Textarea
                id="inq-message"
                placeholder="Describe what you need..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                data-ocid="inquiry.message.textarea"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setInquireService(null)}
                data-ocid="inquiry.cancel.button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => inquiryMutation.mutate()}
                disabled={
                  !message || !contactEmail || inquiryMutation.isPending
                }
                className="bg-primary hover:bg-primary/80"
                data-ocid="inquiry.submit.button"
              >
                {inquiryMutation.isPending ? "Sending..." : "Submit Inquiry"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
