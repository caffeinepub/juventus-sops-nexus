import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Copy,
  Loader2,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { paymentRoute } from "../App";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";

type PaymentMethod = {
  id: bigint;
  methodName: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  instructions: string;
};

export default function PaymentPage() {
  const { orderId } = paymentRoute.useSearch();
  const { actor } = useActor();

  const [receiptNote, setReceiptNote] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: paymentMethods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["paymentMethods"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getPaymentMethods();
    },
    enabled: !!actor,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await (actor as any).submitPaymentConfirmation(
        BigInt(orderId ?? 0),
        receiptNote,
        contactEmail,
      );
    },
    onSuccess: () => {
      toast.success("Payment confirmation sent!");
      setConfirmed(true);
    },
    onError: () =>
      toast.error("Failed to send confirmation. Please try again."),
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          {orderId !== undefined && (
            <p className="text-accent font-semibold text-lg">
              ✓ Order #{orderId} placed successfully
            </p>
          )}
          <p className="text-muted-foreground mt-2">
            Transfer to any of the accounts below, then confirm your payment.
          </p>
        </div>

        {/* Payment Methods */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Payment Account Details
          </h2>

          {isLoading && (
            <div
              className="flex items-center gap-2 text-muted-foreground py-8 justify-center"
              data-ocid="payment.loading_state"
            >
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading payment details...
            </div>
          )}

          {!isLoading && paymentMethods.length === 0 && (
            <Card
              className="border-border bg-card"
              data-ocid="payment.empty_state"
            >
              <CardContent className="p-6 text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-accent opacity-70" />
                <p className="font-medium mb-1">
                  Payment details will be available shortly.
                </p>
                <p className="text-muted-foreground text-sm mb-4">
                  Please contact us on WhatsApp for immediate payment
                  instructions.
                </p>
                <Button
                  asChild
                  className="bg-accent text-background hover:bg-accent/80"
                >
                  <a
                    href="https://wa.me/2348169104637?text=Hello%20Juventus%20Sops%2C%20I%20need%20payment%20details%20for%20my%20order"
                    target="_blank"
                    rel="noopener noreferrer"
                    data-ocid="payment.whatsapp.button"
                  >
                    Contact on WhatsApp
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {paymentMethods.map((method, i) => (
              <Card
                key={String(method.id)}
                className="border-border bg-card card-glow transition-all"
                data-ocid={`payment.method.item.${i + 1}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                    {method.methodName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Bank</span>
                      <p className="font-medium mt-0.5">{method.bankName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Account Name
                      </span>
                      <p className="font-medium mt-0.5">{method.accountName}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">
                      Account Number
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono tracking-wider">
                        {method.accountNumber}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopy(method.accountNumber, `acct-${i}`)
                        }
                        className="shrink-0"
                        data-ocid={`payment.copy.button.${i + 1}`}
                      >
                        {copiedId === `acct-${i}` ? (
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {method.instructions && (
                    <p className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                      {method.instructions}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mb-8" />

        {/* Confirm Payment Form */}
        {confirmed ? (
          <Card
            className="border-accent/40 bg-accent/10"
            data-ocid="payment.success_state"
          >
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-bold mb-2">Confirmation Sent!</h3>
              <p className="text-muted-foreground mb-6">
                We've received your payment confirmation. We'll process your
                order shortly.
              </p>
              <Button
                asChild
                variant="outline"
                data-ocid="payment.view_orders.button"
              >
                <Link to="/orders">View My Orders</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <section>
            <h2 className="text-xl font-semibold mb-1">Confirm Your Payment</h2>
            <p className="text-muted-foreground text-sm mb-5">
              After making your transfer, enter your receipt or payment
              reference below.
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="receipt-note">Receipt / Payment Note</Label>
                <Textarea
                  id="receipt-note"
                  placeholder="e.g. Transfer reference: 123456, or describe your payment"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                  data-ocid="payment.receipt.textarea"
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Your Email Address</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1.5"
                  data-ocid="payment.email.input"
                />
              </div>
              <Button
                className="w-full bg-primary hover:bg-primary/80"
                disabled={
                  !receiptNote.trim() ||
                  !contactEmail.trim() ||
                  confirmMutation.isPending
                }
                onClick={() => confirmMutation.mutate()}
                data-ocid="payment.confirm.submit_button"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Confirmation"
                )}
              </Button>
              {confirmMutation.isError && (
                <p
                  className="text-destructive text-sm"
                  data-ocid="payment.error_state"
                >
                  Failed to send. Please try again or contact us on WhatsApp.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Bottom links */}
        <div className="mt-10 text-center">
          <Link
            to="/orders"
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
            data-ocid="payment.orders.link"
          >
            View my orders →
          </Link>
        </div>
      </div>
    </div>
  );
}
