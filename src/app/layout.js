import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  userUser,
} from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { useEffect, useState, createContext, useContext } from "react";
import { initializeSodium } from "@/utils/encryption";

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

const EncryptionKeyContext = createContext(null);
export const useEncryptionKey = () => useContext(EncryptionKeyContext);

function EncryptionKeyProvider({ children }) {
  const { isSignedIn, isLoading, user } = useUser();
  const [dataEncryptionKey, setDataEncryptionKey] = useState(null);
  const [sodiumInitialized, setSodiumInitialized] = useState(false);

  useEffect(() => {
    const initSodium = async () => {
      await initializeSodium();
      setSodiumInitialized(true);
    };

    initSodium();
  }, []);

  useEffect(() => {
    if (isSignedIn && user && sodiumInitialized) {
      const fetchEncryptionKey = async () => {
        try {
          const response = await fetch("/api/encryption/retrieve-key");
          if (response.ok) {
            const data = await response.json();
            setDataEncryptionKey(data.dataEncryptionKey);
            console.log("Data encryption key retrieved successfully.");
          } else {
          }
          console.error(
            "Failed to retrieve data encryption key:",
            response.status
          );
        } catch (error) {
          console.error("Error fetching data encryption key:".error);
        }
      };

      fetchEncryptionKey();
    } else if (!isSignedIn) {
      setDataEncryptionKey(null);
    }
  }, [isSignedIn, user, sodiumInitialized]);

  return (
    <EncryptionKeyContext.Provider value={dataEncryptionKey}>
      {children}
    </EncryptionKeyContext.Provider>
  );
}

export default function RootLayout({ children }) {
  return (
    <html>
      <ClerkProvider
        frontendApi={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      >
        <body>
          <div
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <header className="flex justify-end items-center p-4 gap-4 h-16">
              <SignedOut>
                <Link href="/sign-in">
                  <button>sign in</button>
                </Link>
                <Link href="/sign-up">
                  <button>sign up</button>
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </header>
            <EncryptionKeyContext>{children}</EncryptionKeyContext>
          </div>
        </body>
      </ClerkProvider>
    </html>
  );
}
