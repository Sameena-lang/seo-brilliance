import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Check, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  component: CheckoutRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      plan: search['plan'] as string || "pro",
    }
  }
});

function CheckoutRoute() {
  const { plan } = Route.useSearch();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const price = plan === "agency" ? 149 : 49;
  const planName = plan === "agency" ? "Agency Plan" : "Pro Plan";

  const handleSimulatedPayment = () => {
    setIsProcessing(true);
    toast.loading("Processing payment...");
    
    setTimeout(() => {
      toast.dismiss();
      toast.success("Payment successful! Welcome aboard.");
      navigate({ to: "/dashboard" });
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur px-6 flex h-16 items-center">
        <Brand />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <Button variant="ghost" className="mb-4" onClick={() => navigate({ to: "/" })}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            <h1 className="text-3xl font-bold font-display">Complete your order</h1>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>{planName}</CardTitle>
                <CardDescription>Billed monthly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-end mb-6 border-b border-border pb-6">
                  <span className="text-muted-foreground">Total due today</span>
                  <span className="text-4xl font-bold tracking-tight">${price}</span>
                </div>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-x-3 text-muted-foreground">
                    <Check className="h-5 w-5 flex-none text-primary" />
                    Full access to all {planName} features
                  </li>
                  <li className="flex gap-x-3 text-muted-foreground">
                    <Check className="h-5 w-5 flex-none text-primary" />
                    Priority customer support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Express Checkout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full h-12 bg-black text-white hover:bg-black/90 flex items-center justify-center gap-2 font-semibold text-lg"
                  onClick={handleSimulatedPayment}
                  disabled={isProcessing}
                >
                  Pay with GPay
                </Button>
                
                <Button 
                  className="w-full h-12 bg-[#0070ba] text-white hover:bg-[#003087] flex items-center justify-center gap-2 font-semibold text-lg"
                  onClick={handleSimulatedPayment}
                  disabled={isProcessing}
                >
                  Pay with PayPal
                </Button>
              </CardContent>
            </Card>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-muted/30 px-2 text-muted-foreground">Or pay with card</span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Credit or debit card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="card">Card Information</Label>
                  <div className="relative">
                    <Input id="card" placeholder="1234 5678 9101 1121" className="pl-10" />
                    <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full h-12 text-lg font-medium" 
                  onClick={handleSimulatedPayment}
                  disabled={isProcessing}
                >
                  Pay ${price}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
