import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";

export default function ServiceRequestPage() {
  const search = useSearch({ from: "/service-request" });
  const navigate = useNavigate();
  const { actor } = useActor();

  const serviceName = search.serviceName || "Service";
  const serviceId = search.serviceId;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.submitInquiry(
        serviceId ?? BigInt(0),
        `Name: ${name}\n\n${description}`,
        email,
      );
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => toast.error("Failed to submit request. Please try again."),
  });

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    description.trim().length > 0 &&
    !submitMutation.isPending;

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        data-ocid="service_request.success_state"
      >
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Request Sent!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you,{" "}
            <span className="font-semibold text-foreground">{name}</span>! Your
            service request for{" "}
            <span className="font-semibold text-accent">{serviceName}</span> has
            been received. We'll reach out to you at{" "}
            <span className="font-semibold text-foreground">{email}</span>{" "}
            shortly.
          </p>
          <Button
            onClick={() => navigate({ to: "/services" })}
            className="bg-accent text-background hover:bg-accent/80"
            data-ocid="service_request.back_to_services.button"
          >
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back button */}
        <button
          type="button"
          onClick={() => navigate({ to: "/services" })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
          data-ocid="service_request.back.button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Request Service</h1>
          <p className="text-accent font-medium">{serviceName}</p>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in your details below and we'll get back to you as soon as
            possible.
          </p>
        </div>

        <Card className="card-glow border-border bg-card">
          <CardContent className="p-6 space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="sr-name">Full Name</Label>
              <Input
                id="sr-name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-ocid="service_request.name.input"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="sr-email">Email Address</Label>
              <Input
                id="sr-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-ocid="service_request.email.input"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="sr-description">Describe What You Need</Label>
              <Textarea
                id="sr-description"
                placeholder="Tell us about the type of service you need, any specific requirements, budget, timeline, etc."
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-ocid="service_request.description.textarea"
              />
            </div>

            {/* Submit */}
            <Button
              className="w-full bg-accent text-background hover:bg-accent/80 gap-2"
              disabled={!canSubmit}
              onClick={() => submitMutation.mutate()}
              data-ocid="service_request.confirm.button"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending
                ? "Sending..."
                : "Confirm & Send Request"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
