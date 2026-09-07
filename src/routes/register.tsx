import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  component: RegisterRoute,
});

function RegisterRoute() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/register', data),
    onSuccess: (data: any) => {
      localStorage.setItem('token', data.data.token);
      queryClient.setQueryData(['auth', 'me'], data.data.user);
      navigate({ to: "/dashboard" });
    },
    onError: (err: any) => {
      setError(err.message || 'Registration failed. Please try again.');
    }
  });

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm-password');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (fullName && email && password) {
      registerMutation.mutate({ fullName, email, password });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center">
          <Brand className="scale-125 mb-6" />
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground font-display">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your 14-day free trial. No credit card required.
          </p>
        </div>

        <div className="bg-card px-6 py-8 shadow-sm ring-1 ring-border sm:rounded-xl sm:px-10">
          {error && <div className="mb-4 text-sm text-destructive">{error}</div>}
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <Label htmlFor="name">Full name</Label>
              <div className="mt-2">
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="mt-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="mt-2">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="mt-2">
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full shadow-md shadow-primary/20">
                Create account
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/90">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
