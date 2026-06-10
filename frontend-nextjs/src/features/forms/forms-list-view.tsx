"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Download, FilePlus2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAbilities } from "@/hooks/use-abilities";
import { Permissions } from "@/lib/auth/permissions";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { FormListMeta, FormTemplate, FormTemplateLibraryItem } from "@/lib/api/types";

type FormsListViewProps = {
  tenantSlug: string;
};

export function FormsListView({ tenantSlug }: FormsListViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canCreate = can(Permissions.forms.create);

  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [meta, setMeta] = useState<FormListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<FormTemplateLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "50" });
      if (searchDebounced) params.set("q", searchDebounced);
      const res = await createApiClient(getApiClientOptions()).get<{
        data: FormTemplate[];
        meta: FormListMeta;
      }>(`/${tenantSlug}/forms?${params}`);
      setTemplates(res.data);
      setMeta(res.meta);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not load forms");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, searchDebounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const openLibrary = async () => {
    setLibraryOpen(true);
    setLibraryLoading(true);
    try {
      const res = await createApiClient(getApiClientOptions()).get<{ data: FormTemplateLibraryItem[] }>(
        `/${tenantSlug}/forms/library`
      );
      setLibrary(res.data);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not load template library");
    } finally {
      setLibraryLoading(false);
    }
  };

  const createForm = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: FormTemplate }>(
        `/${tenantSlug}/forms`,
        { name: newName.trim(), category: "general", fields: [] }
      );
      toast.success("Form created");
      setCreateOpen(false);
      setNewName("");
      window.location.href = `/${tenantSlug}/forms/${res.data.uuid}`;
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not create form");
    } finally {
      setCreating(false);
    }
  };

  const importFromLibrary = async (slug: string) => {
    setImportingSlug(slug);
    try {
      const res = await createApiClient(getApiClientOptions()).post<{ data: FormTemplate }>(
        `/${tenantSlug}/forms/library/import`,
        { slug }
      );
      toast.success("Template imported");
      setLibraryOpen(false);
      await load();
      window.location.href = `/${tenantSlug}/forms/${res.data.uuid}`;
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Import failed");
    } finally {
      setImportingSlug(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Forms</h1>
          <p className="text-sm text-muted-foreground">
            Build intake forms, patch tests, and checklists for clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canCreate ? (
            <>
              <Button variant="outline" size="sm" onClick={() => void openLibrary()}>
                <Download className="mr-2 h-4 w-4" />
                Library
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New form
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search forms…" />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No forms yet"
          description={
            canCreate
              ? "Create a blank form or import a starter template from the library."
              : "Forms created by your team will appear here."
          }
          action={
            canCreate ? (
              <Button onClick={() => setCreateOpen(true)}>
                <FilePlus2 className="mr-2 h-4 w-4" />
                Create form
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {meta ? (
            <p className="text-xs text-muted-foreground">{meta.total} form{meta.total === 1 ? "" : "s"}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Link key={t.uuid} href={`/${tenantSlug}/forms/${t.uuid}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{t.name}</CardTitle>
                      <Badge variant={t.is_active ? "default" : "secondary"}>
                        {t.is_active ? "Active" : "Draft"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {t.description || `${t.fields?.length ?? 0} fields · ${t.category}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {t.submissions_count ?? 0} submission{(t.submissions_count ?? 0) === 1 ? "" : "s"}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New form</DialogTitle>
            <DialogDescription>Start with a blank form. Add fields in the builder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="form-name">Name</Label>
            <Input
              id="form-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Client intake"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={creating || !newName.trim()} onClick={() => void createForm()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Template library</DialogTitle>
            <DialogDescription>Import a ready-made form and customize it for your salon.</DialogDescription>
          </DialogHeader>
          {libraryLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-3">
              {library.map((item) => (
                <Card key={item.slug}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canCreate || importingSlug === item.slug}
                      onClick={() => void importFromLibrary(item.slug)}
                    >
                      Import
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
