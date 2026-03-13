import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Package,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse at 60% 0%, rgba(124,58,237,0.25) 0%, transparent 60%), radial-gradient(ellipse at 10% 80%, rgba(202,138,4,0.12) 0%, transparent 50%), #0a0a14",
      }}
      data-ocid="login.page"
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">
            Juventus Sops Nexus
          </span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">
          The Digital Marketplace for Smart Solutions
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-6 py-12 max-w-7xl mx-auto w-full">
        {/* Left: branding / features */}
        <div className="flex-1 flex flex-col gap-8 max-w-lg">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium">
            <Star className="w-3 h-3 fill-current" />
            Trusted Digital Marketplace
          </div>

          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white mb-4">
              Welcome to <span className="text-primary">Juventus Sops</span>{" "}
              <span style={{ color: "#ca8a04" }}>Nexus</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Your one-stop hub for digital products, creative services, and
              smart tech solutions. Join thousands of creators and
              entrepreneurs.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/8 bg-white/4 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-white">
                Digital Products
              </p>
              <p className="text-xs text-muted-foreground">
                AI Packs, eBooks, Courses &amp; more
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/8 bg-white/4 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-yellow-400" />
              </div>
              <p className="text-sm font-semibold text-white">Pro Services</p>
              <p className="text-xs text-muted-foreground">
                Web Design, Chatbots &amp; Tech
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/8 bg-white/4 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <p className="text-sm font-semibold text-white">
                Secure &amp; Fast
              </p>
              <p className="text-xs text-muted-foreground">
                Blockchain-powered platform
              </p>
            </div>
          </div>
        </div>

        {/* Right: login card */}
        <div
          className="w-full max-w-sm flex flex-col gap-6 p-8 rounded-2xl border border-white/10 shadow-2xl shadow-primary/10"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(10,10,20,0.95) 100%)",
            backdropFilter: "blur(16px)",
          }}
          data-ocid="login.card"
        >
          {/* Card header */}
          <div className="flex flex-col gap-1 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-2 shadow-lg shadow-primary/40">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Sign In</h2>
            <p className="text-sm text-muted-foreground">
              Access your account to shop, order, and manage your digital
              assets.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground">Secure Login</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Login button */}
          <Button
            size="lg"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full font-semibold text-base gap-2 bg-primary hover:bg-primary/80 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            data-ocid="login.submit.button"
          >
            {isLoggingIn ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Continue with Internet Identity
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Trust note */}
          <div className="flex items-center gap-2 text-center justify-center">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <p className="text-xs text-muted-foreground">
              Secured by Internet Identity -- no password needed
            </p>
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-muted-foreground/60">
            By signing in you agree to our terms of service and privacy policy.
          </p>
        </div>
      </main>

      {/* Bottom footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground/50 border-t border-white/5">
        &copy; {new Date().getFullYear()} Juventus Sops Nexus &mdash; All rights
        reserved.
      </footer>
    </div>
  );
}
