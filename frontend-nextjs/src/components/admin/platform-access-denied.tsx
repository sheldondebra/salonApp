"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createApiClient } from "@/lib/api/client";
import { salonWorkspacePath } from "@/lib/auth/redirect-after-auth";
import { clearAuthToken, getApiClientOptions } from "@/lib/auth/session";
import type { User } from "@/lib/api/types";

export function PlatformAccessDenied() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    createApiClient(getApiClientOptions())
      .get<{ user: User }>("/me")
      .then((res) => setUser(res.user))
      .catch(() => setUser(null));
  }, []);

  const salonPath = user ? salonWorkspacePath(user) : null;
  const isSalonAccount =
    user && user.user_type !== "super_admin" && user.user_type !== "office_admin";

  function signOut() {
    clearAuthToken();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="max-w-md space-y-3">
        <p className="text-lg font-semibold">No platform access</p>
        <p className="text-sm text-muted-foreground">
          General Office is for platform staff only (Super Admin and Office Admin). Salon owner and
          team accounts use their salon workspace instead.
        </p>
        {user ? (
          <p className="text-sm text-muted-foreground">
            Signed in as <strong className="text-foreground">{user.email}</strong> (
            {user.user_type.replace(/_/g, " ")}).
          </p>
        ) : null}
        {isSalonAccount ? (
          <p className="text-sm text-muted-foreground">
            Use <strong className="text-foreground">office@salonapp.com</strong> for General Office
            (demo password: <code className="rounded bg-muted px-1">password</code>).
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {isSalonAccount && salonPath ? (
          <Button className="gap-2 rounded-xl" asChild>
            <Link href={salonPath}>
              <Building2 className="h-4 w-4" />
              Open salon dashboard
            </Link>
          </Button>
        ) : null}
        <Button variant="outline" className="gap-2 rounded-xl" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
