"use client"
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

const TawTo = () => {
  const tawkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s1 = document.createElement('script');
    s1.async = true;
    s1.src = `https://embed.tawk.to/${process.env.NEXT_PUBLIC_TAWK_TO_ID}`;
    s1.setAttribute('crossorigin', '*');
    document.head.appendChild(s1);

    // Initialize Tawk_API
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Example of using Tawk_API
    window.Tawk_API.onLoad = function() {
      console.log('Tawk.to widget loaded');
    };

    window.Tawk_API.onChatMaximized = function() {
      console.log('Chat maximized');
    };

    window.Tawk_API.onChatMinimized = function() {
      console.log('Chat minimized');
    };

    window.Tawk_API.onChatHidden = function() {
      console.log('Chat hidden');
    };

    window.Tawk_API.onChatStarted = function() {
      console.log('Chat started');
    };

    window.Tawk_API.onChatEnded = function() {
      console.log('Chat ended');
    };

    return () => {
      document.head.removeChild(s1);
    };
  }, []);

  return <div ref={tawkRef} />;
};

export default TawTo;