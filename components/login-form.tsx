"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { OAuthProviders } from "@/components/oauth-providers";
import { Turnstile } from "next-turnstile";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [turnstileStatus, setTurnstileStatus] = useState<
    "success" | "error" | "expired" | "required"
  >("required");
  const turnstileRef = useRef<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (turnstileStatus !== "success") {
      setError("Please complete the security check");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/auth/sign-in-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 shadow-lg">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#DEDCFF] to-[#6f58ff] bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="bg-white/5 border-white/10 focus:border-indigo-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Your password"
                  required
                  className="bg-white/5 border-white/10 focus:border-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded-md">
                  {error}
                </p>
              )}

              <Turnstile
                className="flex justify-center"
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onError={() => {
                  setTurnstileStatus("error");
                  setError("Security check failed. Please try again.");
                }}
                onExpire={() => {
                  setTurnstileStatus("expired");
                  setError("Security check expired. Please verify again.");
                }}
                onLoad={() => {
                  setTurnstileStatus("required");
                  setError(null);
                  setIsLoading(true);
                }}
                onVerify={(token) => {
                  turnstileRef.current = token;
                  setTurnstileStatus("success");
                  setError(null);
                  setIsLoading(false);
                }}
              />

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign in"}
              </Button>
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/auth/sign-up"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <OAuthProviders />
      </div>
    </div>
  );
}
