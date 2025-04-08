
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Todolist",
  description: "Simple todolist",
};

export default function RootLayout({ children }) {
  return (
    <html>
    <ClerkProvider frontendApi={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <body>
      <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="flex justify-end items-center p-4 gap-4 h-16">
          <SignedOut>
            <Link href="/sign-in"><button>sign in</button></Link> 
            <Link href='/sign-up'><button>sign up</button></Link>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </header>
        {children}
      </div>
      </body>
    </ClerkProvider>
    </html>
  );
}
