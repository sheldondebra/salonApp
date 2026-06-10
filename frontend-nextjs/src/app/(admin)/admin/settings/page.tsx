"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/admin/plans", label: "SaaS plans" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/payment-providers/mtn-momo", label: "MTN MoMo provider" },
  { href: "/admin/sms", label: "SMS Hub" },
  { href: "/admin/users", label: "Platform users" },
];

export default function AdminSystemSettingsPage() {
  return (
    <AdminShell title="System settings" description="Platform configuration and provider controls">
      <RequirePlatformPermission permission={[Permissions.office.settings, Permissions.billing.manage]}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              Configuration shortcuts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {LINKS.map((link) => (
              <Button key={link.href} variant="outline" className="rounded-xl" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
