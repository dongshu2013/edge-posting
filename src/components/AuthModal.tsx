'use client';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog";
import { AuthButton } from "@/components/AuthButton";
import { useAuth } from "@/hooks/useAuth";

function AuthModalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [initialRender, setInitialRender] = useState(true);

  // Handle initial render and signin param
  useEffect(() => {
    const shouldOpen = searchParams?.get("signin") === "true";
    setIsOpen(shouldOpen);
    setInitialRender(false);
  }, [searchParams]);

  // Handle auth state changes
  useEffect(() => {
    // Skip on initial render to prevent immediate closing
    if (initialRender) return;
    
    // Close modal when user is authenticated
    if (isAuthenticated && isOpen) {
      console.log("User authenticated, closing modal");
      setIsOpen(false);
      
      // Remove the signin param from URL
      const url = new URL(window.location.href);
      if (url.searchParams.get("signin") === "true") {
        url.searchParams.delete("signin");
        router.replace(url.pathname + url.search);
      }
    }
  }, [isAuthenticated, isOpen, router, initialRender]);

  const handleClose = () => {
    setIsOpen(false);
    
    // Remove the signin param from URL
    const url = new URL(window.location.href);
    if (url.searchParams.get("signin") === "true") {
      url.searchParams.delete("signin");
      router.replace(url.pathname + url.search);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in required</DialogTitle>
          <DialogDescription>
            Please sign in to access this feature
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <AuthButton />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AuthModal() {
  return (
    <Suspense fallback={null}>
      <AuthModalContent />
    </Suspense>
  );
} 