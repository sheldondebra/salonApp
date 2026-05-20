"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { RequirePlatformPermission } from "@/components/auth/require-platform-permission";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminToolbar } from "@/features/admin/admin-toolbar";
import { Permissions } from "@/lib/auth/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createApiClient } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { AdminUser } from "@/features/admin/admin-user-types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (typeFilter) params.set("user_type", typeFilter);
    if (statusFilter === "active") params.set("is_active", "1");
    if (statusFilter === "inactive") params.set("is_active", "0");
    if (statusFilter === "blocked") params.set("is_blocked", "1");
    if (statusFilter === "unverified") params.set("email_verified", "0");
    createApiClient(getApiClientOptions())
      .get<{ data: AdminUser[] }>(`/admin/users?${params}`)
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <AdminShell
      title="Users"
      description="Platform staff and salon owners — booking clients are not listed here"
    >
      <RequirePlatformPermission permission={Permissions.tenants.view}>
        <Card className="rounded-2xl shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Salon & platform users
            </CardTitle>
            <AdminToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search name or email">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 w-40 rounded-xl border border-input bg-card px-3 text-sm"
                aria-label="Filter by role"
              >
                <option value="">All roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="office_admin">Office Admin</option>
                <option value="tenant_owner">Tenant Owner</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-40 rounded-xl border border-input bg-card px-3 text-sm"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
                <option value="unverified">Email unverified</option>
              </select>
            </AdminToolbar>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Tenants</TableHead>
                      <TableHead>Last login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {u.user_type?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{u.tenants_count ?? u.tenants?.length ?? 0}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.last_login_at
                            ? format(new Date(u.last_login_at), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={u.is_active ? "default" : "outline"}>
                              {u.is_active ? "Active" : "Off"}
                            </Badge>
                            {u.is_blocked ? <Badge variant="warning">Blocked</Badge> : null}
                            {!u.email_verified ? (
                              <Badge variant="outline">Unverified</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
                            <Link href={`/admin/users/${u.uuid}`}>Details</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </RequirePlatformPermission>
    </AdminShell>
  );
}
