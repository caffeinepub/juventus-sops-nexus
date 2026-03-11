import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrderType, Product, Service, ServiceInquiry } from "../backend.d";
import { Status } from "../backend.d";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
          <TabsList className="mb-6" data-ocid="admin.tabs">
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
              Inquiries ({inquiries.length})
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
            <div className="space-y-3">
              {products.map((product, i) => (
                <Card
                  key={String(product.id)}
                  className="border-border bg-card"
                  data-ocid={`admin.product.item.${i + 1}`}
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
                        data-ocid={`admin.product.edit_button.${i + 1}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        data-ocid={`admin.product.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {products.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.products.empty_state"
                >
                  No products yet. Add your first product!
                </div>
              )}
            </div>
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
            <div className="space-y-3">
              {services.map((service, i) => (
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
              {services.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.services.empty_state"
                >
                  No services yet. Add your first service!
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
            <h2 className="text-xl font-semibold mb-4">Service Inquiries</h2>
            <div className="space-y-3">
              {inquiries.map((inq, i) => (
                <Card
                  key={String(inq.id)}
                  className="border-border bg-card"
                  data-ocid={`admin.inquiry.item.${i + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{inq.contactEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          Number(inq.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {inq.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {inquiries.length === 0 && (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="admin.inquiries.empty_state"
                >
                  No inquiries yet.
                </div>
              )}
            </div>
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
    </div>
  );
}
