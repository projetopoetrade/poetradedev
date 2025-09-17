"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function SignInSuccess() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Redirect to dashboard after 3 seconds
    const redirectTimeout = setTimeout(() => {
      try {
        router.push("/");
      } catch (error) {
        console.error("Navigation failed:", error);
      }
    }, 3000);

    // Update progress every 100ms
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 3.33; // 100/30 to reach 100 in 3 seconds
      });
    }, 100);

    return () => {
      clearTimeout(redirectTimeout);
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full bg-white/5 backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-[#DEDCFF] to-[#6f58ff] bg-clip-text text-transparent">
              Welcome Back!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="flex justify-center"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </motion.div>
            <div className="space-y-2">
              <p className="text-center text-lg font-medium text-white">
                Sign In Successful
              </p>
              <p className="text-center text-sm text-muted-foreground">
                You will be redirected to the dashboard in a moment...
              </p>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full hover:bg-white/10 transition-colors"
              >
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
} 