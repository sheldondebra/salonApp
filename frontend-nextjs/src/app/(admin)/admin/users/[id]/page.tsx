"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle,
  KeyRound,
  Link2,
  Mail,
  Monitor,
  Shield,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { ErrorState } from "@/components/shared/error-state";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { AdminUser } from "@/features/admin/admin-user-types";
import { isUuid } from "@/lib/uuid";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/50 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userUuid = typeof params.id === "string" ? params.id : "";
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(() => {
    if (!isUuid(userUuid)) {
      setError("Invalid user link.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    createApiClient(getApiClientOptions())
      .get<{ data: AdminUser }>(`/admin/users/${userUuid}`)
      .then((res) => setUser(res.data))
      .catch((err) => {
        setUser(null);
        setError(err instanceof ApiError ? err.message : "Could not load user");
      })
      .finally(() => setLoading(false));
  }, [userUuid]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Record<string, unknown>, message: string) {
    if (!user) return;
    setActing(true);
    try {
      const res = await createApiClient(getApiClientOptions()).patch<{ data: AdminUser }>(
        `/admin/users/${user.uuid}`,
        body
      );
      setUser(res.data);
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action failed");
    } finally {
      setActing(false);
    }
  }

  async function sendResetLink() {
    if (!user) return;
    setActing(true);
    try {
      await createApiClient(getApiClientOptions()).post(
        `/admin/users/${user.uuid}/password-reset-link`
      );
      toast.success(`Reset link sent to ${user.email}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send reset link");
    } finally {
      setActing(false);
    }
  }

  async function resetPasswordAndEmail() {
    if (!user) return;
    if (
      !confirm(
        `Generate a new temporary password and email it to ${user.email}? Their current sessions will be signed out.`
      )
    ) {
      return;
    }
    setActing(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ message: string }>(
        `/admin/users/${user.uuid}/reset-password`
      );
      toast.success(res.message ?? "Password reset and email sent");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not reset password");
    } finally {
      setActing(false);
    }
  }

  async function removeUser() {
    if (!user || !confirm(`Soft-delete ${user.name}? They will not be able to sign in.`)) return;
    setActing(true);
    try {
      await createApiClient(getApiClientOptions()).delete(`/admin/users/${user.uuid}`);
      toast.success("User removed");
      router.push("/admin/users");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <AdminShell title="User details" description="Loading…">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </AdminShell>
    );
  }

  if (error || !user) {
    return (
      <AdminShell title="User details" description="Account management">
        <ErrorState description={error ?? "User not found"} onRetry={load} />
      </AdminShell>
    );
  }

  const deleted = Boolean(user.deleted_at);

  return (
    <AdminShell title={user.name} description={user.email}>
      <RequirePlatformPermission permission={Permissions.tenants.view}>
        <div className="space-y-6">
          <Button variant="ghost" className="gap-2 rounded-xl" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
              All users
            </Link>
          </Button>

          <div className="flex flex-wrap gap-2">
            <Badge variant={user.is_active ? "default" : "outline"}>
              {user.is_active ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={user.is_blocked ? "warning" : "secondary"}>
              {user.is_blocked ? "Blocked" : "Not blocked"}
            </Badge>
            <Badge variant={user.email_verified ? "default" : "outline"}>
              {user.email_verified ? "Email verified" : "Email unverified"}
            </Badge>
            {deleted ? <Badge variant="outline">Deleted</Badge> : null}
            <Badge variant="secondary" className="capitalize">
              {user.user_type.replace(/_/g, " ")}
            </Badge>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" />
                  Profile
                </CardTitle>
                <CardDescription>Platform / salon account (not a booking client)</CardDescription>
              </CardHeader>
              <CardContent>
                <DetailRow label="Name" value={user.name} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Phone" value={user.phone ?? "—"} />
                <DetailRow
                  label="Onboarding"
                  value={user.onboarding_status?.replace(/_/g, " ") ?? "—"}
                />
                <DetailRow label="Plan" value={user.selected_plan ?? "—"} />
                <DetailRow
                  label="Joined"
                  value={
                    user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "—"
                  }
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor className="h-4 w-4" />
                  Last login
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow
                  label="When"
                  value={
                    user.last_login_at
                      ? format(new Date(user.last_login_at), "MMM d, yyyy · h:mm a")
                      : "Never"
                  }
                />
                <DetailRow label="IP" value={user.last_login_ip ?? "—"} />
                <DetailRow label="Device" value={user.last_login_device ?? "—"} />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Tenant workspaces
              </CardTitle>
              <CardDescription>Salons this user belongs to — not client booking profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {!user.tenants?.length ? (
                <p className="text-sm text-muted-foreground">No tenant linked yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salon</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.tenants.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>
                          <Link href={`/${t.slug}/dashboard`} className="text-accent hover:underline">
                            /{t.slug}
                          </Link>
                        </TableCell>
                        <TableCell className="capitalize">{t.plan}</TableCell>
                        <TableCell>{t.is_owner ? "Owner" : "Member"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Login logs</CardTitle>
              <CardDescription>Recent sign-in attempts (success and failed)</CardDescription>
            </CardHeader>
            <CardContent>
              {!user.login_logs?.length ? (
                <p className="text-sm text-muted-foreground">No login activity recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.login_logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.logged_in_at), "MMM d · h:mm a")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={log.status === "success" ? "default" : "outline"}
                              className="capitalize"
                            >
                              {log.status}
                            </Badge>
                            {log.failure_reason ? (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({log.failure_reason.replace(/_/g, " ")})
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>{log.device_label ?? "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{log.ip_address ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                disabled={acting || deleted}
                onClick={sendResetLink}
              >
                <Link2 className="h-4 w-4" />
                Send reset link
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                disabled={acting || deleted}
                onClick={resetPasswordAndEmail}
              >
                <KeyRound className="h-4 w-4" />
                Reset password & email
              </Button>
              {!user.email_verified ? (
                <Button
                  variant="outline"
                  className="gap-2 rounded-xl"
                  disabled={acting}
                  onClick={() => patch({ verify_email: true }, "Email marked as verified")}
                >
                  <Mail className="h-4 w-4" />
                  Verify email
                </Button>
              ) : (
                <Button variant="secondary" className="gap-2 rounded-xl" disabled>
                  <CheckCircle className="h-4 w-4" />
                  Email verified
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                disabled={acting}
                onClick={() =>
                  patch({ is_active: !user.is_active }, user.is_active ? "User deactivated" : "User activated")
                }
              >
                <UserX className="h-4 w-4" />
                {user.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                disabled={acting}
                onClick={() =>
                  patch({ is_blocked: !user.is_blocked }, user.is_blocked ? "User unblocked" : "User blocked")
                }
              >
                <Ban className="h-4 w-4" />
                {user.is_blocked ? "Unblock" : "Block user"}
              </Button>
              {deleted ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={acting}
                  onClick={() => patch({ restore: true }, "User restored")}
                >
                  Restore user
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  className="gap-2 rounded-xl"
                  disabled={acting}
                  onClick={removeUser}
                >
                  <Trash2 className="h-4 w-4" />
                  Soft delete
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
