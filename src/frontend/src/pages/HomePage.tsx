import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  Bot,
  Brain,
  Building2,
  CheckCircle,
  Coins,
  Globe,
  GraduationCap,
  Heart,
  Image,
  Instagram,
  Lightbulb,
  Linkedin,
  Mail,
  MessageCircle,
  Palette,
  PenTool,
  Store,
  Target,
  TrendingUp,
  Twitter,
  Users,
  Zap,
} from "lucide-react";
import type { Product, Service } from "../backend.d";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useActor } from "../hooks/useActor";

const PRODUCT_CATEGORIES = [
  { name: "AI Prompt Packs", icon: Brain, desc: "Unlock AI potential" },
  {
    name: "Health Tech Content",
    icon: Heart,
    desc: "Health technology resources",
  },
  { name: "eBooks & White Papers", icon: BookOpen, desc: "Expert insights" },
  { name: "Digital Courses", icon: GraduationCap, desc: "Practical learning" },
  {
    name: "Health Tips & Educational Content",
    icon: Lightbulb,
    desc: "Wellness knowledge",
  },
  {
    name: "Ghostwritten Materials",
    icon: PenTool,
    desc: "Professional writing",
  },
  {
    name: "Visual & Multimedia Assets",
    icon: Image,
    desc: "Creative resources",
  },
  { name: "Kids Storybooks", icon: BookMarked, desc: "Educational stories" },
];

const SERVICE_CATEGORIES = [
  {
    name: "Graphics & Web Design",
    icon: Palette,
    desc: "Creative visual designs",
  },
  {
    name: "CAC & SCUML Registration",
    icon: Building2,
    desc: "Business registration",
  },
  { name: "Chatbot Development", icon: Bot, desc: "Smart automation" },
  { name: "Mini WebStore Creation", icon: Store, desc: "Digital storefronts" },
  { name: "Social Media Growth", icon: TrendingUp, desc: "Boost your reach" },
  { name: "Token Creation & Minting", icon: Coins, desc: "Blockchain assets" },
];

const WHY_US = [
  {
    icon: Zap,
    title: "Innovation",
    desc: "We combine creativity and technology to build modern digital solutions.",
  },
  {
    icon: Target,
    title: "Expertise",
    desc: "Our products and services are crafted to meet real business needs in today's digital economy.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    desc: "Our solutions are designed to be simple, scalable, and accessible to entrepreneurs everywhere.",
  },
  {
    icon: TrendingUp,
    title: "Growth Focused",
    desc: "Everything we build is designed to help individuals and businesses grow faster.",
  },
];

function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="card-glow transition-all border-border bg-card">
      <CardContent className="p-5">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        <p className="text-accent font-bold">
          ${(Number(product.price) / 100).toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <Card className="card-glow transition-all border-border bg-card">
      <CardContent className="p-5">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mb-3">
          <Palette className="w-5 h-5 text-accent" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {service.description}
        </p>
        <p className="text-primary font-semibold text-sm">
          {service.priceLabel}
        </p>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const { actor } = useActor();

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: () => actor?.getProducts(null) ?? Promise.resolve([]),
    enabled: !!actor,
  });

  const { data: allServices = [] } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => actor?.getServices() ?? Promise.resolve([]),
    enabled: !!actor,
  });

  const featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 3);
  const featuredServices = allServices.filter((s) => s.isFeatured).slice(0, 3);

  return (
    <div className="">
      {/* Hero */}
      <section
        className="hero-gradient relative min-h-[90vh] flex items-center justify-center text-center px-4"
        data-ocid="hero.section"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-6 text-sm text-primary">
            <Zap className="w-3.5 h-3.5" />
            The Digital Marketplace for Smart Solutions
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 glow-purple text-foreground">
            Welcome to
            <br />
            <span className="text-primary">Juventus Sops</span>{" "}
            <span className="text-accent">Nexus</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Your one-stop hub for digital products, creative services, and smart
            tech solutions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-primary hover:bg-primary/80 shadow-lg shadow-primary/20"
              data-ocid="hero.explore_products.button"
            >
              <Link to="/products" search={{}}>
                Explore Products
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-accent text-accent hover:bg-accent hover:text-background"
              data-ocid="hero.explore_services.button"
            >
              <Link to="/services" search={{}}>
                Explore Services
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Shop by Categories */}
      <section
        className="py-20 px-4 max-w-7xl mx-auto"
        data-ocid="categories.section"
      >
        <h2 className="text-3xl font-bold text-center mb-3">
          Shop by Categories
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Browse our full range of digital solutions
        </p>
        <div className="grid md:grid-cols-2 gap-12">
          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Digital Products
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {PRODUCT_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to="/products"
                  search={{ category: cat.name }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
                  data-ocid={`category.product.${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.link`}
                >
                  <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <cat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground leading-tight">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold text-accent mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" /> Digital Services
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  to="/services"
                  search={{ category: cat.name }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-all"
                  data-ocid={`category.service.${cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.link`}
                >
                  <div className="w-8 h-8 rounded-md bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <cat.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground leading-tight">
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section
        className="py-20 px-4 bg-secondary/20"
        data-ocid="why_us.section"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            Why Choose Juventus Sops?
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Smart Solutions for Modern Businesses
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((item) => (
              <Card
                key={item.title}
                className="card-glow border-border bg-card"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center space-y-2">
            {[
              "Innovative Digital Products",
              "Professional Creative Services",
              "Automation & Tech Tools",
              "Designed for Entrepreneurs & Businesses",
            ].map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 mr-6 text-sm"
              >
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section
        className="py-20 px-4 max-w-7xl mx-auto"
        data-ocid="featured_products.section"
      >
        <h2 className="text-3xl font-bold text-center mb-3">
          Featured Products
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          Discover some of our most popular digital resources
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featuredProducts.length > 0
            ? featuredProducts.map((product) => (
                <ProductCard key={String(product.id)} product={product} />
              ))
            : [
                {
                  id: 0n,
                  name: "Premium AI Prompt Packs",
                  description:
                    "Professionally crafted prompts for productivity and content creation.",
                  price: 2999n,
                  category: "AI Prompt Packs",
                  imageUrl: "",
                  isFeatured: true,
                  isAvailable: true,
                },
                {
                  id: 1n,
                  name: "Digital Business Guides",
                  description:
                    "In-depth eBooks covering business strategy and technology.",
                  price: 1499n,
                  category: "eBooks & White Papers",
                  imageUrl: "",
                  isFeatured: true,
                  isAvailable: true,
                },
                {
                  id: 2n,
                  name: "Online Courses for Entrepreneurs",
                  description:
                    "Practical courses to build digital and business skills.",
                  price: 4999n,
                  category: "Digital Courses",
                  imageUrl: "",
                  isFeatured: true,
                  isAvailable: true,
                },
              ].map((product) => (
                <ProductCard key={String(product.id)} product={product} />
              ))}
        </div>
        <div className="text-center">
          <Button
            asChild
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white"
            data-ocid="featured_products.view_all.button"
          >
            <Link to="/products" search={{}}>
              View All Products
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Services */}
      <section
        className="py-20 px-4 bg-secondary/20"
        data-ocid="featured_services.section"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">
            Featured Services
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Professional solutions for your digital needs
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredServices.length > 0
              ? featuredServices.map((service) => (
                  <ServiceCard key={String(service.id)} service={service} />
                ))
              : [
                  {
                    id: 0n,
                    name: "Mini WebStore Creation",
                    description:
                      "Professional mini webstores to display and sell products digitally.",
                    priceLabel: "Starting from $150",
                    category: "Mini WebStore Creation",
                    imageUrl: "",
                    isFeatured: true,
                  },
                  {
                    id: 1n,
                    name: "Chatbot Development",
                    description:
                      "Smart bots to automate customer support and interactions.",
                    priceLabel: "Starting from $200",
                    category: "Chatbot Development",
                    imageUrl: "",
                    isFeatured: true,
                  },
                  {
                    id: 2n,
                    name: "Branding & Web Design",
                    description:
                      "Creative visual designs and modern websites for your brand.",
                    priceLabel: "Starting from $100",
                    category: "Graphics & Web Design",
                    imageUrl: "",
                    isFeatured: true,
                  },
                ].map((service) => (
                  <ServiceCard key={String(service.id)} service={service} />
                ))}
          </div>
          <div className="text-center">
            <Button
              asChild
              className="bg-accent text-background hover:bg-accent/80"
              data-ocid="featured_services.book.button"
            >
              <Link to="/services" search={{}}>
                Book a Service
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 text-center" data-ocid="mission.section">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our mission is to empower entrepreneurs, creators, and organizations
            with the tools, knowledge, and technology they need to succeed in
            the global digital marketplace.
          </p>
          <p className="text-muted-foreground mt-4">
            We are committed to building solutions that make innovation
            accessible to everyone.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-4 bg-gradient-to-r from-primary/20 via-background to-accent/10 text-center"
        data-ocid="cta.section"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Ready to take your business digital?
          </h2>
          <p className="text-muted-foreground mb-8">
            Explore our marketplace or request a service today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-primary hover:bg-primary/80"
              data-ocid="cta.start_shopping.button"
            >
              <Link to="/products" search={{}}>
                Start Shopping
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-accent text-accent hover:bg-accent hover:text-background"
              data-ocid="cta.request_service.button"
            >
              <Link to="/services" search={{}}>
                Request a Service
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t border-border bg-card py-12 px-4"
        data-ocid="footer.section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg glow-purple text-primary">
                  Juventus Sops
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Digital Products • Creative Services • Smart Solutions
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Follow Us</h4>
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/sops_splarchie?igsh=ajBiZ2doemU0aTc5"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  data-ocid="footer.instagram.link"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://wa.me/2348169104637?text=Hello%20Juventus%20Sops%2C%20I%20am%20interested%20in%20your%20Mini%20WebStore%20service"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  data-ocid="footer.whatsapp.link"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/ikeh-juventus-786a71368"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  data-ocid="footer.linkedin.link"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com/Sops_truptar"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  data-ocid="footer.twitter.link"
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <a
                href="mailto:patrickjuventus82@gmail.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                data-ocid="footer.email.link"
              >
                <Mail className="w-4 h-4" />
                patrickjuventus82@gmail.com
              </a>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Juventus Sops Nexus. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
