import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  OrderType,
  PaymentConfirmation,
  Product,
  Service,
  ServiceInquiry,
  UserRecord,
} from "../backend.d";
import { Status, UserRole } from "../backend.d";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
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

const SERVICE_CATEGORIES = [
  "Graphics & Web Design",
  "CAC & SCUML Registration",
  "Chatbot Development",
  "Mini WebStore Creation",
  "Social Media Growth",
  "Token Creation & Minting",
];

const PAGE_SIZE = 20;

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  isFeatured: boolean;
  isAvailable: boolean;
};
type ServiceForm = {
  name: string;
  description: string;
  priceLabel: string;
  category: string;
  imageUrl: string;
  isFeatured: boolean;
};

type PaymentMethod = {
  id: bigint;
  methodName: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  instructions: string;
};

type PaymentMethodForm = {
  methodName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
};

const emptyProduct: ProductForm = {
  name: "",
  description: "",
  price: "",
  category: PRODUCT_CATEGORIES[0],
  imageUrl: "",
  isFeatured: false,
  isAvailable: true,
};
const emptyService: ServiceForm = {
  name: "",
  description: "",
  priceLabel: "",
  category: SERVICE_CATEGORIES[0],
  imageUrl: "",
  isFeatured: false,
};
const emptyPaymentMethod: PaymentMethodForm = {
  methodName: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  instructions: "",
};

function truncatePrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 8)}...${p.slice(-4)}`;
}

function formatJoinDate(ns: bigint): string {
  const ms = Number(ns) / 1_000_000;
  return new Date(ms).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RoleBadge({ role }: { role: UserRole | string }) {
  if (role === UserRole.admin || role === "admin") {
    return (
      <Badge className="bg-accent text-background text-xs font-semibold">
        Admin
      </Badge>
    );
  }
  if (role === UserRole.user || role === "user") {
    return (
      <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
        User
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Guest
    </Badge>
  );
}

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: isAdmin = false } = useQuery({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: () => actor?.isCallerAdmin() ?? Promise.resolve(false),
    enabled: !!actor && isAuthenticated,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: () => actor?.getProducts(null) ?? Promise.resolve([]),
    enabled: !!actor && isAdmin,
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => actor?.getServices() ?? Promise.resolve([]),
    enabled: !!actor && isAdmin,
  });

  const { data: orders = [] } = useQuery<OrderType[]>({
    queryKey: ["admin", "orders"],
    queryFn: () => actor?.getOrders() ?? Promise.resolve([]),
    enabled: !!actor && isAdmin,
  });

  const { data: inquiries = [] } = useQuery<ServiceInquiry[]>({
    queryKey: ["admin", "inquiries"],
    queryFn: () => actor?.getInquiries() ?? Promise.resolve([]),
    enabled: !!actor && isAdmin,
  });

  const { data: paymentConfirmations = [] } = useQuery<PaymentConfirmation[]>({
    queryKey: ["admin", "paymentConfirmations"],
    queryFn: () =>
      (actor as any)?.getPaymentConfirmations?.() ?? Promise.resolve([]),
    enabled: !!actor && isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<UserRecord[]>({
    queryKey: ["admin", "users"],
    queryFn: () => actor?.getUsers() ?? Promise.resolve([]),
    enabled: !!actor && isAdmin,
  });

  const { data: paymentMethods = [], isLoading: pmLoading } = useQuery<
    PaymentMethod[]
  >({
    queryKey: ["admin", "paymentMethods"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPaymentMethods();
    },
    enabled: !!actor && isAdmin,
  });

  // Product search / filter / pagination state
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productPage, setProductPage] = useState(1);

  // Service search / filter state
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("all");

  // Product dialog
  const [productDialog, setProductDialog] = useState<{
    open: boolean;
    editing?: Product;
  }>({
    open: false,
  });
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);

  // Service dialog
  const [serviceDialog, setServiceDialog] = useState<{
    open: boolean;
    editing?: Service;
  }>({
    open: false,
  });
  const [serviceForm, setServiceForm] = useState<ServiceForm>(emptyService);

  // Payment method dialog
  const [pmDialog, setPmDialog] = useState<{
    open: boolean;
    editing?: PaymentMethod;
  }>({
    open: false,
  });
  const [pmForm, setPmForm] = useState<PaymentMethodForm>(emptyPaymentMethod);

  // Filtered + paginated products
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCategory =
        productCategoryFilter === "all" || p.category === productCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  const totalProductPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );
  const clampedProductPage = Math.min(productPage, totalProductPages);
  const pagedProducts = filteredProducts.slice(
    (clampedProductPage - 1) * PAGE_SIZE,
    clampedProductPage * PAGE_SIZE,
  );

  // Reset page when filters change
  const handleProductSearchChange = (val: string) => {
    setProductSearch(val);
    setProductPage(1);
  };
  const handleProductCategoryChange = (val: string) => {
    setProductCategoryFilter(val);
    setProductPage(1);
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    const q = serviceSearch.toLowerCase();
    return services.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q);
      const matchesCategory =
        serviceCategoryFilter === "all" || s.category === serviceCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [services, serviceSearch, serviceCategoryFilter]);

  const addProductMutation = useMutation({
    mutationFn: async (form: ProductForm) => {
      if (!actor) throw new Error();
      const priceInCents = Math.round(Number.parseFloat(form.price) * 100);
      await actor.addProduct({
        id: 0n,
        name: form.name,
        description: form.description,
        price: BigInt(priceInCents),
        category: form.category,
        imageUrl: form.imageUrl,
        isFeatured: form.isFeatured,
        isAvailable: form.isAvailable,
      });
    },
    onSuccess: () => {
      toast.success("Product added!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductDialog({ open: false });
    },
    onError: () => toast.error("Failed to add product"),
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, form }: { id: bigint; form: ProductForm }) => {
      if (!actor) throw new Error();
      const priceInCents = Math.round(Number.parseFloat(form.price) * 100);
      await actor.updateProduct(id, {
        id,
        name: form.name,
        description: form.description,
        price: BigInt(priceInCents),
        category: form.category,
        imageUrl: form.imageUrl,
        isFeatured: form.isFeatured,
        isAvailable: form.isAvailable,
      });
    },
    onSuccess: () => {
      toast.success("Product updated!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setProductDialog({ open: false });
    },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error();
      await actor.removeProduct(id);
    },
    onSuccess: () => {
      toast.success("Product deleted!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const addServiceMutation = useMutation({
    mutationFn: async (form: ServiceForm) => {
      if (!actor) throw new Error();
      await actor.addService({
        id: 0n,
        name: form.name,
        description: form.description,
        priceLabel: form.priceLabel,
        category: form.category,
        imageUrl: form.imageUrl,
        isFeatured: form.isFeatured,
      });
    },
    onSuccess: () => {
      toast.success("Service added!");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setServiceDialog({ open: false });
    },
    onError: () => toast.error("Failed to add service"),
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, form }: { id: bigint; form: ServiceForm }) => {
      if (!actor) throw new Error();
      await actor.updateService(id, {
        id,
        name: form.name,
        description: form.description,
        priceLabel: form.priceLabel,
        category: form.category,
        imageUrl: form.imageUrl,
        isFeatured: form.isFeatured,
      });
    },
    onSuccess: () => {
      toast.success("Service updated!");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setServiceDialog({ open: false });
    },
    onError: () => toast.error("Failed to update service"),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error();
      await actor.removeService(id);
    },
    onSuccess: () => {
      toast.success("Service deleted!");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: () => toast.error("Failed to delete service"),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: bigint; status: Status }) => {
      if (!actor) throw new Error();
      await actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      toast.success("Order status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: () => toast.error("Failed to update order"),
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async (form: PaymentMethodForm) => {
      if (!actor) throw new Error();
      await (actor as any).addPaymentMethod({
        id: 0n,
        methodName: form.methodName,
        bankName: form.bankName,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        instructions: form.instructions,
      });
    },
    onSuccess: () => {
      toast.success("Payment method added!");
      queryClient.invalidateQueries({ queryKey: ["admin", "paymentMethods"] });
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      setPmDialog({ open: false });
    },
    onError: () => toast.error("Failed to add payment method"),
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({
      id,
      form,
    }: { id: bigint; form: PaymentMethodForm }) => {
      if (!actor) throw new Error();
      await (actor as any).updatePaymentMethod(id, {
        id,
        methodName: form.methodName,
        bankName: form.bankName,
        accountName: form.accountName,
        accountNumber: form.accountNumber,
        instructions: form.instructions,
      });
    },
    onSuccess: () => {
      toast.success("Payment method updated!");
      queryClient.invalidateQueries({ queryKey: ["admin", "paymentMethods"] });
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
      setPmDialog({ open: false });
    },
    onError: () => toast.error("Failed to update payment method"),
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error();
      await (actor as any).removePaymentMethod(id);
    },
    onSuccess: () => {
      toast.success("Payment method removed!");
      queryClient.invalidateQueries({ queryKey: ["admin", "paymentMethods"] });
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    },
    onError: () => toast.error("Failed to remove payment method"),
  });

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-destructive opacity-60" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="products">
          <TabsList
            className="mb-6 flex-wrap h-auto gap-1"
            data-ocid="admin.tabs"
          >
            <TabsTrigger value="products" data-ocid="admin.products.tab">
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="services" data-ocid="admin.services.tab">
              Services ({services.length})
            </TabsTrigger>
            <TabsTrigger value="orders" data-ocid="admin.orders.tab">
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="inquiries" data-ocid="admin.inquiries.tab">
              Service Requests ({inquiries.length})
            </TabsTrigger>
            <TabsTrigger
              value="payment-confirmations"
              data-ocid="admin.payment_confirmations.tab"
            >
              Payment Confirmations ({paymentConfirmations.length})
            </TabsTrigger>
            <TabsTrigger value="users" data-ocid="admin.users.tab">
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger
              value="payment-methods"
              data-ocid="admin.payment_methods.tab"
            >
              Payment Methods
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Products</h2>
              <Button
                onClick={() => {
                  setProductForm(emptyProduct);
                  setProductDialog({ open: true });
                }}
                className="bg-primary hover:bg-primary/80"
                data-ocid="admin.add_product.button"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or category..."
                  value={productSearch}
                  onChange={(e) => handleProductSearchChange(e.target.value)}
                  className="pl-9 pr-8"
                  data-ocid="admin.products.search_input"
                />
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => handleProductSearchChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Select
                value={productCategoryFilter}
                onValueChange={handleProductCategoryChange}
              >
                <SelectTrigger
                  className="w-full sm:w-56"
                  data-ocid="admin.products.category.select"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result count */}
            <p className="text-sm text-muted-foreground mb-3">
              Showing{" "}
              {filteredProducts.length === products.length
                ? `all ${products.length}`
                : `${filteredProducts.length} of ${products.length}`}{" "}
              product{products.length !== 1 ? "s" : ""}
              {totalProductPages > 1 &&
                ` — page ${clampedProductPage} of ${totalProductPages}`}
            </p>

            <div className="space-y-3">
              {pagedProducts.map((product, i) => {
                const globalIndex =
                  (clampedProductPage - 1) * PAGE_SIZE + i + 1;
                return (
                  <Card
                    key={String(product.id)}
                    className="border-border bg-card"
                    data-ocid={`admin.product.item.${globalIndex}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{product.name}</p>
                          {product.isFeatured && (
                            <Badge variant="secondary" className="text-xs">
                              Featured
                            </Badge>
                          )}
                          {!product.isAvailable && (
                            <Badge variant="destructive" className="text-xs">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {product.category} • $
                          {(Number(product.price) / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setProductForm({
                              name: product.name,
                              description: product.description,
                              price: (Number(product.price) / 100).toString(),
                              category: product.category,
                              imageUrl: product.imageUrl,
                              isFeatured: product.isFeatured,
                              isAvailable: product.isAvailable,
                            });
                            setProductDialog({ open: true, editing: product });
                          }}
                          data-ocid={`admin.product.edit_button.${globalIndex}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            deleteProductMutation.mutate(product.id)
                          }
                          data-ocid={`admin.product.delete_button.${globalIndex}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredProducts.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.products.empty_state"
                >
                  {products.length === 0
                    ? "No products yet. Add your first product!"
                    : "No products match your search. Try different filters."}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalProductPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  disabled={clampedProductPage <= 1}
                  data-ocid="admin.products.pagination_prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {clampedProductPage} / {totalProductPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setProductPage((p) => Math.min(totalProductPages, p + 1))
                  }
                  disabled={clampedProductPage >= totalProductPages}
                  data-ocid="admin.products.pagination_next"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Services</h2>
              <Button
                onClick={() => {
                  setServiceForm(emptyService);
                  setServiceDialog({ open: true });
                }}
                className="bg-accent text-background hover:bg-accent/80"
                data-ocid="admin.add_service.button"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Service
              </Button>
            </div>

            {/* Search + Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search services by name or category..."
                  value={serviceSearch}
                  onChange={(e) => {
                    setServiceSearch(e.target.value);
                  }}
                  className="pl-9 pr-8"
                  data-ocid="admin.services.search_input"
                />
                {serviceSearch && (
                  <button
                    type="button"
                    onClick={() => setServiceSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <Select
                value={serviceCategoryFilter}
                onValueChange={(val) => setServiceCategoryFilter(val)}
              >
                <SelectTrigger
                  className="w-full sm:w-56"
                  data-ocid="admin.services.category.select"
                >
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result count */}
            <p className="text-sm text-muted-foreground mb-3">
              Showing{" "}
              {filteredServices.length === services.length
                ? `all ${services.length}`
                : `${filteredServices.length} of ${services.length}`}{" "}
              service{services.length !== 1 ? "s" : ""}
            </p>

            <div className="space-y-3">
              {filteredServices.map((service, i) => (
                <Card
                  key={String(service.id)}
                  className="border-border bg-card"
                  data-ocid={`admin.service.item.${i + 1}`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{service.name}</p>
                        {service.isFeatured && (
                          <Badge variant="secondary" className="text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {service.category} • {service.priceLabel}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setServiceForm({
                            name: service.name,
                            description: service.description,
                            priceLabel: service.priceLabel,
                            category: service.category,
                            imageUrl: service.imageUrl,
                            isFeatured: service.isFeatured,
                          });
                          setServiceDialog({ open: true, editing: service });
                        }}
                        data-ocid={`admin.service.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteServiceMutation.mutate(service.id)}
                        data-ocid={`admin.service.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredServices.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.services.empty_state"
                >
                  {services.length === 0
                    ? "No services yet. Add your first service!"
                    : "No services match your search. Try different filters."}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <h2 className="text-xl font-semibold mb-4">All Orders</h2>
            <div className="space-y-3">
              {orders.map((order, i) => (
                <Card
                  key={String(order.id)}
                  className="border-border bg-card"
                  data-ocid={`admin.order.item.${i + 1}`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-medium">Order #{String(order.id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          Number(order.createdAt) / 1_000_000,
                        ).toLocaleDateString()}{" "}
                        • {order.items.length} items • $
                        {(Number(order.totalAmount) / 100).toFixed(2)}
                      </p>
                    </div>
                    <Select
                      value={order.status}
                      onValueChange={(val) =>
                        updateOrderStatusMutation.mutate({
                          orderId: order.id,
                          status: val as Status,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-36"
                        data-ocid={`admin.order.status.select.${i + 1}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(Status).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
              {orders.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.orders.empty_state"
                >
                  No orders yet.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries">
            <h2 className="text-xl font-semibold mb-4">Service Requests</h2>
            <div className="space-y-3">
              {inquiries.map((inq, i) => {
                const lines = inq.message.split("\n\n");
                const nameLine = lines[0] ?? "";
                const customerName = nameLine.startsWith("Name: ")
                  ? nameLine.slice(6)
                  : nameLine;
                const description = lines.slice(1).join("\n\n");
                return (
                  <Card
                    key={String(inq.id)}
                    className="border-border bg-card"
                    data-ocid={`admin.inquiry.item.${i + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            Service #{String(inq.id)}
                          </Badge>
                          <p className="font-semibold text-sm text-foreground">
                            {customerName}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(
                            Number(inq.createdAt) / 1_000_000,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {inq.contactEmail}
                      </p>
                      {description && (
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {inquiries.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.inquiries.empty_state"
                >
                  No service requests yet.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Payment Confirmations Tab */}
          <TabsContent value="payment-confirmations">
            <h2 className="text-xl font-semibold mb-4">
              Payment Confirmations
            </h2>
            <div className="space-y-3">
              {paymentConfirmations.map((conf, i) => (
                <Card
                  key={String(conf.id)}
                  className="border-border bg-card"
                  data-ocid={`admin.payment_confirmation.item.${i + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-mono">
                          Order #{String(conf.orderId)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(
                          Number(conf.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      {conf.contactEmail}
                    </p>
                    {conf.receiptNote && (
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {conf.receiptNote}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() =>
                        updateOrderStatusMutation.mutate({
                          orderId: conf.orderId,
                          status: Status.completed,
                        })
                      }
                      disabled={updateOrderStatusMutation.isPending}
                    >
                      {updateOrderStatusMutation.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : null}
                      Mark as Completed
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {paymentConfirmations.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.payment_confirmations.empty_state"
                >
                  No payment confirmations yet.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Registered Users</h2>
            </div>

            {usersLoading ? (
              <div
                className="text-center py-12 text-muted-foreground"
                data-ocid="admin.users.loading_state"
              >
                Loading users...
              </div>
            ) : users.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="admin.users.empty_state"
              >
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No users have signed up yet.</p>
                <p className="text-sm mt-1 opacity-70">
                  Users will appear here once they register on the webstore.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table data-ocid="admin.users.table">
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="font-semibold">#</TableHead>
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">
                        Principal ID
                      </TableHead>
                      <TableHead className="font-semibold">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, i) => {
                      const principalStr = user.principal.toString();
                      const displayName = user.profileName ?? "Anonymous";
                      return (
                        <TableRow
                          key={principalStr}
                          className="hover:bg-muted/20 transition-colors"
                          data-ocid={`admin.user.item.${i + 1}`}
                        >
                          <TableCell className="text-muted-foreground text-sm">
                            {i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm">
                                {displayName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={user.role} />
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {truncatePrincipal(principalStr)}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatJoinDate(user.joinedAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold">Payment Methods</h2>
              </div>
              <Button
                onClick={() => {
                  setPmForm(emptyPaymentMethod);
                  setPmDialog({ open: true });
                }}
                className="bg-accent text-background hover:bg-accent/80"
                data-ocid="admin.add_payment_method.button"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Payment Method
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              These account details will be shown to customers after they place
              an order.
            </p>

            {pmLoading ? (
              <div
                className="flex items-center gap-2 text-muted-foreground py-8 justify-center"
                data-ocid="admin.payment_methods.loading_state"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </div>
            ) : paymentMethods.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="admin.payment_methods.empty_state"
              >
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No payment methods added yet.</p>
                <p className="text-sm mt-1 opacity-70">
                  Add your bank account details so customers know where to pay.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((pm, i) => (
                  <Card
                    key={String(pm.id)}
                    className="border-border bg-card"
                    data-ocid={`admin.payment_method.item.${i + 1}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{pm.methodName}</p>
                        <p className="text-sm text-muted-foreground">
                          {pm.bankName} • {pm.accountName} • {pm.accountNumber}
                        </p>
                        {pm.instructions && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {pm.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPmForm({
                              methodName: pm.methodName,
                              bankName: pm.bankName,
                              accountName: pm.accountName,
                              accountNumber: pm.accountNumber,
                              instructions: pm.instructions,
                            });
                            setPmDialog({ open: true, editing: pm });
                          }}
                          data-ocid={`admin.payment_method.edit_button.${i + 1}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            deletePaymentMethodMutation.mutate(pm.id)
                          }
                          data-ocid={`admin.payment_method.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Product Dialog */}
      <Dialog
        open={productDialog.open}
        onOpenChange={(open) => setProductDialog({ open })}
      >
        <DialogContent className="max-w-lg" data-ocid="admin.product.dialog">
          <DialogHeader>
            <DialogTitle>
              {productDialog.editing ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Name</Label>
              <Input
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                data-ocid="admin.product.name.input"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                data-ocid="admin.product.description.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  data-ocid="admin.product.price.input"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={productForm.category}
                  onValueChange={(v) =>
                    setProductForm({ ...productForm, category: v })
                  }
                >
                  <SelectTrigger data-ocid="admin.product.category.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.isFeatured}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      isFeatured: e.target.checked,
                    })
                  }
                  data-ocid="admin.product.featured.checkbox"
                />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.isAvailable}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      isAvailable: e.target.checked,
                    })
                  }
                  data-ocid="admin.product.available.checkbox"
                />
                <span className="text-sm">Available</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setProductDialog({ open: false })}
                data-ocid="admin.product.cancel.button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (productDialog.editing) {
                    updateProductMutation.mutate({
                      id: productDialog.editing.id,
                      form: productForm,
                    });
                  } else {
                    addProductMutation.mutate(productForm);
                  }
                }}
                disabled={
                  !productForm.name ||
                  !productForm.price ||
                  addProductMutation.isPending ||
                  updateProductMutation.isPending
                }
                className="bg-primary hover:bg-primary/80"
                data-ocid="admin.product.save.button"
              >
                {productDialog.editing ? "Save Changes" : "Add Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog
        open={serviceDialog.open}
        onOpenChange={(open) => setServiceDialog({ open })}
      >
        <DialogContent className="max-w-lg" data-ocid="admin.service.dialog">
          <DialogHeader>
            <DialogTitle>
              {serviceDialog.editing ? "Edit Service" : "Add New Service"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Name</Label>
              <Input
                value={serviceForm.name}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, name: e.target.value })
                }
                data-ocid="admin.service.name.input"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                data-ocid="admin.service.description.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price Label</Label>
                <Input
                  value={serviceForm.priceLabel}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      priceLabel: e.target.value,
                    })
                  }
                  placeholder="e.g. Starting from $50"
                  data-ocid="admin.service.price_label.input"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={serviceForm.category}
                  onValueChange={(v) =>
                    setServiceForm({ ...serviceForm, category: v })
                  }
                >
                  <SelectTrigger data-ocid="admin.service.category.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceForm.isFeatured}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      isFeatured: e.target.checked,
                    })
                  }
                  data-ocid="admin.service.featured.checkbox"
                />
                <span className="text-sm">Featured</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setServiceDialog({ open: false })}
                data-ocid="admin.service.cancel.button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (serviceDialog.editing) {
                    updateServiceMutation.mutate({
                      id: serviceDialog.editing.id,
                      form: serviceForm,
                    });
                  } else {
                    addServiceMutation.mutate(serviceForm);
                  }
                }}
                disabled={
                  !serviceForm.name ||
                  !serviceForm.priceLabel ||
                  addServiceMutation.isPending ||
                  updateServiceMutation.isPending
                }
                className="bg-accent text-background hover:bg-accent/80"
                data-ocid="admin.service.save.button"
              >
                {serviceDialog.editing ? "Save Changes" : "Add Service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog
        open={pmDialog.open}
        onOpenChange={(open) => setPmDialog({ open })}
      >
        <DialogContent
          className="max-w-lg"
          data-ocid="admin.payment_method.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {pmDialog.editing ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Method Name</Label>
              <Input
                placeholder="e.g. Bank Transfer, Mobile Money"
                value={pmForm.methodName}
                onChange={(e) =>
                  setPmForm({ ...pmForm, methodName: e.target.value })
                }
                data-ocid="admin.payment_method.name.input"
              />
            </div>
            <div>
              <Label>Bank Name</Label>
              <Input
                placeholder="e.g. First Bank, GTBank"
                value={pmForm.bankName}
                onChange={(e) =>
                  setPmForm({ ...pmForm, bankName: e.target.value })
                }
                data-ocid="admin.payment_method.bank.input"
              />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input
                placeholder="Full account name"
                value={pmForm.accountName}
                onChange={(e) =>
                  setPmForm({ ...pmForm, accountName: e.target.value })
                }
                data-ocid="admin.payment_method.account_name.input"
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                placeholder="Account number"
                value={pmForm.accountNumber}
                onChange={(e) =>
                  setPmForm({ ...pmForm, accountNumber: e.target.value })
                }
                data-ocid="admin.payment_method.account_number.input"
              />
            </div>
            <div>
              <Label>Instructions (optional)</Label>
              <Textarea
                placeholder="Any special instructions for customers"
                value={pmForm.instructions}
                onChange={(e) =>
                  setPmForm({ ...pmForm, instructions: e.target.value })
                }
                rows={2}
                data-ocid="admin.payment_method.instructions.textarea"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPmDialog({ open: false })}
                data-ocid="admin.payment_method.cancel.button"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pmDialog.editing) {
                    updatePaymentMethodMutation.mutate({
                      id: pmDialog.editing.id,
                      form: pmForm,
                    });
                  } else {
                    addPaymentMethodMutation.mutate(pmForm);
                  }
                }}
                disabled={
                  !pmForm.methodName ||
                  !pmForm.bankName ||
                  !pmForm.accountName ||
                  !pmForm.accountNumber ||
                  addPaymentMethodMutation.isPending ||
                  updatePaymentMethodMutation.isPending
                }
                className="bg-accent text-background hover:bg-accent/80"
                data-ocid="admin.payment_method.save.button"
              >
                {pmDialog.editing ? "Save Changes" : "Add Method"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
