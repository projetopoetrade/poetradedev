import Image from "next/image";
import Link from "next/link";
import { JSX, SVGProps } from "react";
import { ThemeSwitcher } from "./theme-switcher";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations('Footer');
  return (
    <footer className="w-full bg-black/40 text-white py-8 px-4 md:px-10">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and Social Links */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <Image
              src="/images/logo.webp"
              height="60"
              width="96"
              alt="Path of Trade"
              className="object-contain"
            />
            <div className="flex space-x-4">
              <Link 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-opacity hover:opacity-80"
                aria-label="Visit our Facebook page"
              >
                <FacebookIcon className="h-5 w-5 text-white" />
              </Link>
              <Link 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-opacity hover:opacity-80"
                aria-label="Visit our Twitter page"
              >
                <TwitterIcon className="h-5 w-5 text-white" />
              </Link>
              <Link 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-opacity hover:opacity-80"
                aria-label="Visit our Instagram page"
              >
                <InstagramIcon className="h-5 w-5 text-white" />
              </Link>
              <Link 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="transition-opacity hover:opacity-80"
                aria-label="Join our Discord server"
              >
                <DiscordIcon className="h-5 w-5 text-white" />
              </Link>
            </div>
          </div>

          {/* Main Links */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-1">{t('main')}</h3>
            <Link href="/" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('home')}
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('about-us')}
            </Link>
            <Link href="/products" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('products')}
            </Link>
            <div className="pt-2">
              <ThemeSwitcher />
            </div>
          </div>

          {/* Support Links */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-1">{t('support')}</h3>
            <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('contact-us')}
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('faq')}
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('blog')}
            </Link>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-1">{t('legal')}</h3>
            <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('privacy-policy')}
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('terms-of-service')}
            </Link>
            <Link href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
              {t('refund-policy')}
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <p className="text-sm text-center text-gray-400">© {new Date().getFullYear()} Path of Trade. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function DiscordIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
    </svg>
  );
}

function TwitterIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}
