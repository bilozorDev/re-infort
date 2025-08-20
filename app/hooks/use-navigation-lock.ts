import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface UseNavigationLockOptions {
  enabled: boolean;
  message?: string;
  onAttemptedNavigation?: () => void;
}

export function useNavigationLock({
  enabled,
  message = "You have unsaved changes. Are you sure you want to leave?",
  onAttemptedNavigation,
}: UseNavigationLockOptions) {
  const router = useRouter();
  const isLockedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      isLockedRef.current = false;
      return;
    }

    isLockedRef.current = true;

    // Handle browser navigation (back, forward, refresh, close)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLockedRef.current) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    // Add event listener
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Handle Next.js router navigation
    const originalPush = router.push;
    const originalReplace = router.replace;
    const originalBack = router.back;
    const originalForward = router.forward;

    // Override router methods
    router.push = (...args) => {
      if (isLockedRef.current) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          onAttemptedNavigation?.();
          return Promise.resolve(false);
        }
      }
      return originalPush.apply(router, args);
    };

    router.replace = (...args) => {
      if (isLockedRef.current) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          onAttemptedNavigation?.();
          return Promise.resolve(false);
        }
      }
      return originalReplace.apply(router, args);
    };

    router.back = () => {
      if (isLockedRef.current) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          onAttemptedNavigation?.();
          return;
        }
      }
      return originalBack.call(router);
    };

    router.forward = () => {
      if (isLockedRef.current) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          onAttemptedNavigation?.();
          return;
        }
      }
      return originalForward.call(router);
    };

    // Cleanup
    return () => {
      isLockedRef.current = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      // Restore original router methods
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
      router.forward = originalForward;
    };
  }, [enabled, message, onAttemptedNavigation, router]);

  return {
    isLocked: isLockedRef.current,
    unlock: () => {
      isLockedRef.current = false;
    },
  };
}