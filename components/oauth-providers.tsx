'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signWithDiscord, signWithGoogle } from "@/app/actions";
import { useEffect } from "react";

export function OAuthProviders() {
  // Preload connections when component mounts
  useEffect(() => {
    // Preload Google auth endpoint
    const preloadGoogle = document.createElement('link');
    preloadGoogle.rel = 'preconnect';
    preloadGoogle.href = 'https://accounts.google.com';
    document.head.appendChild(preloadGoogle);
    
    // Preload Discord auth endpoint
    const preloadDiscord = document.createElement('link');
    preloadDiscord.rel = 'preconnect';
    preloadDiscord.href = 'https://discord.com';
    document.head.appendChild(preloadDiscord);

    // Clean up
    return () => {
      document.head.removeChild(preloadGoogle);
      document.head.removeChild(preloadDiscord);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Button 
        variant="outline" 
        className="w-full bg-white/5 border-white/10 hover:bg-white/10" 
        onClick={signWithGoogle}
      >
        <Image
          alt="Google logo"
          width={20}
          height={20}
          src="/images/google-logo.svg"
          className="mr-2"
          priority
        />
        <span>Google</span>
      </Button>
      <Button 
        variant="outline" 
        className="w-full bg-white/5 border-white/10 hover:bg-white/10" 
        onClick={signWithDiscord}
      >
        <Image
          alt="Discord logo"
          width={20}
          height={20}
          src="/images/Discord-Symbol-White.svg"
          className="mr-2"
          priority
        />
        <span>Discord</span>
      </Button>
    </div>
  );
} 