"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  Clock,
  FileText,
  Gift,
  Heart,
  History,
  ImageIcon,
  Mail,
  Pencil,
  Phone,
  Plus,
  Scissors,
  Smartphone,
  StickyNote,
  Trash2,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/features/crud/confirm-action";
import { MetricCard } from "@/components/shared/metric-card";
import { PageTabs } from "@/components/shared/page-tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { useClientProfile } from "@/features/clients/use-client-profile";
import { formatMoney } from "@/lib/format/money";
import type { TenantClient } from "@/lib/api/types";

type ClientProfilePanelProps = {
  tenantSlug: string;
  client: TenantClient;
  currency?: string;
  canUpdate: boolean;
  canDelete: boolean;
  canRequestPayment: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onRequestPayment: () => void;
  onClose?: () => void;
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "visits", label: "Visits" },
  { id: "health", label: "Health" },
  { id: "records", label: "Records" },
  { id: "notes", label: "Notes" },
  { id: "payments", label: "Payments" },
  { id: "loyalty", label: "Loyalty" },
  { id: "timeline", label: "Timeline" },
];

function fmtWhen(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return iso;
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

type ListItem = {
  key: string;
  title: string;
  subtitle?: string;
  badge?: string;
  href?: string;
  onDelete?: () => void;
};

function ListSection({
  emptyIcon,
  emptyTitle,
  items,
}: {
  emptyIcon: LucideIcon;
  emptyTitle: string;
  items: ListItem[];
}) {
  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description="Nothing here yet." className="py-8" />;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="min-w-0 flex-1">
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer" className="font-medium text-sm text-primary hover:underline">
                {item.title}
              </a>
            ) : (
              <p className="font-medium text-sm">{item.title}</p>
            )}
            {item.subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p> : null}
          </div>
          {item.badge ? <StatusBadge label={item.badge} tone="neutral" className="shrink-0 capitalize" /> : null}
          {item.onDelete ? (
            <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={item.onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ClientProfilePanel({
  tenantSlug,
  client,
  currency = "GHS",
  canUpdate,
  canDelete,
  canRequestPayment,
  onEdit,
  onRemove,
  onRequestPayment,
  onClose,
}: ClientProfilePanelProps) {
  const { data, loading, error, reload, post, del } = useClientProfile(tenantSlug, client.id);
  const [tab, setTab] = useState("overview");

  const [noteBody, setNoteBody] = useState("");
  const [allergen, setAllergen] = useState("");
  const [productName, setProductName] = useState("");
  const [testedOn, setTestedOn] = useState("");
  const [treatmentName, setTreatmentName] = useState("");
  const [treatmentDate, setTreatmentDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoKind, setPhotoKind] = useState<"before" | "after">("before");
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");

  if (loading && !data) {
    return (
      <Card className="h-full rounded-2xl shadow-soft">
        <CardContent className="p-6">
          <DashboardSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="h-full rounded-2xl shadow-soft">
        <CardContent className="p-6">
          <ErrorState description={error ?? "Profile unavailable"} onRetry={() => void reload()} />
        </CardContent>
      </Card>
    );
  }

  const { stats } = data;

  return (
    <Card className="flex h-full max-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl shadow-soft">
      <CardHeader className="shrink-0 space-y-4 border-b border-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-xl">{data.client.name}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge label={data.client.is_active ? "Active" : "Inactive"} tone={data.client.is_active ? "success" : "neutral"} />
              {data.client.phone ? <span>{data.client.phone}</span> : null}
            </div>
          </div>
          {onClose ? (
            <Button variant="ghost" size="sm" className="shrink-0 rounded-xl md:hidden" onClick={onClose}>
              Back
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <MetricCard title="Total spend" value={formatMoney(stats.total_spend_cents, currency)} icon={CircleDollarSign} className="min-h-0 [&_[class*='CardContent']]:p-3" />
          <MetricCard title="Last visit" value={stats.last_visit_at ? fmtDate(stats.last_visit_at) : "None"} hint={stats.last_visit_service ?? undefined} icon={History} className="min-h-0 [&_[class*='CardContent']]:p-3" />
          <MetricCard title="Next booking" value={stats.next_booking_at ? fmtDate(stats.next_booking_at) : "None"} hint={stats.next_booking_service ?? undefined} icon={CalendarDays} className="min-h-0 [&_[class*='CardContent']]:p-3" />
          <MetricCard title="No-shows" value={String(stats.no_show_count)} hint={`${stats.visit_count} visits`} icon={UserX} className="min-h-0 [&_[class*='CardContent']]:p-3" />
        </div>

        <PageTabs tabs={TABS} value={tab} onChange={setTab} />
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-y-auto pt-4">
        {tab === "overview" ? (
          <div className="space-y-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{data.client.email}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="font-medium">{data.client.phone ?? "—"}</dd>
                </div>
              </div>
              {data.profile.preferred_staff_name ? (
                <div className="sm:col-span-2 text-sm">
                  <span className="text-muted-foreground">Preferred stylist: </span>
                  <span className="font-medium">{data.profile.preferred_staff_name}</span>
                </div>
              ) : null}
            </dl>
            <section>
              <p className="mb-2 text-sm font-semibold">Recent activity</p>
              {data.timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.timeline.slice(0, 5).map((ev, i) => (
                    <li key={`${ev.type}-${ev.occurred_at}-${i}`} className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm">
                      <p className="font-medium">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{fmtWhen(ev.occurred_at)} · {ev.subtitle}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}

        {tab === "visits" ? (
          <ListSection
            emptyIcon={Scissors}
            emptyTitle="No visits yet"
            items={data.visits.map((v) => ({
              key: v.uuid,
              title: v.service_name ?? "Service",
              subtitle: `${fmtWhen(v.starts_at)}${v.staff_name ? ` · ${v.staff_name}` : ""}`,
              badge: v.status,
            }))}
          />
        ) : null}

        {tab === "health" ? (
          <div className="space-y-8">
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" /> Allergies
              </h3>
              {canUpdate ? (
                <form
                  className="mb-4 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!allergen.trim()) return;
                    void post("/allergies", { allergen: allergen.trim(), severity: "moderate" }).then(() => setAllergen(""));
                  }}
                >
                  <Input className="rounded-xl" placeholder="Allergen name" value={allergen} onChange={(e) => setAllergen(e.target.value)} />
                  <Button type="submit" className="shrink-0 rounded-xl" size="sm">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </form>
              ) : null}
              <ListSection
                emptyIcon={AlertTriangle}
                emptyTitle="No allergies recorded"
                items={data.allergies.map((a) => ({
                  key: String(a.id),
                  title: a.allergen,
                  subtitle: a.reaction_notes ?? a.severity,
                  badge: a.is_active ? "active" : "inactive",
                  onDelete: canUpdate ? () => void del(`/allergies/${a.id}`) : undefined,
                }))}
              />
            </section>
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Heart className="h-4 w-4" /> Patch tests
              </h3>
              {canUpdate ? (
                <form
                  className="mb-4 grid gap-2 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!productName.trim() || !testedOn) return;
                    void post("/patch-tests", { product_name: productName.trim(), tested_on: testedOn, result: "passed" }).then(() => {
                      setProductName("");
                      setTestedOn("");
                    });
                  }}
                >
                  <Input className="rounded-xl sm:col-span-2" placeholder="Product" value={productName} onChange={(e) => setProductName(e.target.value)} />
                  <Input className="rounded-xl" type="date" value={testedOn} onChange={(e) => setTestedOn(e.target.value)} />
                  <Button type="submit" className="rounded-xl sm:col-span-3" size="sm">
                    <Plus className="h-4 w-4" /> Add patch test
                  </Button>
                </form>
              ) : null}
              <ListSection
                emptyIcon={Heart}
                emptyTitle="No patch tests"
                items={data.patch_tests.map((p) => ({
                  key: String(p.id),
                  title: p.product_name,
                  subtitle: `${fmtDate(p.tested_on)} · ${p.result}${p.staff_name ? ` · ${p.staff_name}` : ""}`,
                  onDelete: canUpdate ? () => void del(`/patch-tests/${p.id}`) : undefined,
                }))}
              />
            </section>
          </div>
        ) : null}

        {tab === "records" ? (
          <div className="space-y-8">
            <section>
              <h3 className="mb-3 text-sm font-semibold">Treatments</h3>
              {canUpdate ? (
                <form
                  className="mb-4 grid gap-2 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!treatmentName.trim() || !treatmentDate) return;
                    void post("/treatments", { service_name: treatmentName.trim(), treated_at: treatmentDate }).then(() => {
                      setTreatmentName("");
                      setTreatmentDate("");
                    });
                  }}
                >
                  <Input className="rounded-xl sm:col-span-2" placeholder="Treatment / service" value={treatmentName} onChange={(e) => setTreatmentName(e.target.value)} />
                  <Input className="rounded-xl" type="datetime-local" value={treatmentDate} onChange={(e) => setTreatmentDate(e.target.value)} />
                  <Button type="submit" className="rounded-xl sm:col-span-3" size="sm">
                    <Plus className="h-4 w-4" /> Log treatment
                  </Button>
                </form>
              ) : null}
              <ListSection
                emptyIcon={Scissors}
                emptyTitle="No treatment records"
                items={data.treatments.map((t) => ({
                  key: String(t.id),
                  title: t.service_name,
                  subtitle: `${fmtWhen(t.treated_at)}${t.outcome ? ` · ${t.outcome}` : ""}`,
                  onDelete: canUpdate ? () => void del(`/treatments/${t.id}`) : undefined,
                }))}
              />
            </section>
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="h-4 w-4" /> Before / after
              </h3>
              {canUpdate ? (
                <form
                  className="mb-4 grid gap-2 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!photoUrl.trim()) return;
                    void post("/media", { kind: photoKind, url: photoUrl.trim() }).then(() => setPhotoUrl(""));
                  }}
                >
                  <select className="h-10 rounded-xl border border-input bg-card px-3 text-sm" value={photoKind} onChange={(e) => setPhotoKind(e.target.value as "before" | "after")}>
                    <option value="before">Before</option>
                    <option value="after">After</option>
                  </select>
                  <Input className="rounded-xl sm:col-span-2" placeholder="Image URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} />
                  <Button type="submit" className="rounded-xl sm:col-span-3" size="sm">
                    <Plus className="h-4 w-4" /> Add photo
                  </Button>
                </form>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {data.media.length === 0 ? (
                  <EmptyState icon={ImageIcon} title="No photos" description="Add before/after URLs." className="py-8 sm:col-span-2" />
                ) : (
                  data.media.map((m) => (
                    <article key={m.id} className="overflow-hidden rounded-xl border border-border/60">
                      <div className="flex aspect-video items-center justify-center bg-muted/30 text-xs capitalize text-muted-foreground">{m.kind} photo</div>
                      <div className="flex items-center justify-between gap-2 p-2 text-xs">
                        <a href={m.url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
                          {m.caption ?? m.url}
                        </a>
                        {canUpdate ? (
                          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => void del(`/media/${m.id}`)}>
                            Remove
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4" /> Documents
              </h3>
              {canUpdate ? (
                <form
                  className="mb-4 grid gap-2 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!docTitle.trim() || !docUrl.trim()) return;
                    void post("/documents", { title: docTitle.trim(), file_url: docUrl.trim() }).then(() => {
                      setDocTitle("");
                      setDocUrl("");
                    });
                  }}
                >
                  <Input className="rounded-xl" placeholder="Title" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                  <Input className="rounded-xl" placeholder="File URL" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
                  <Button type="submit" className="rounded-xl sm:col-span-2" size="sm">
                    <Plus className="h-4 w-4" /> Add document
                  </Button>
                </form>
              ) : null}
              <ListSection
                emptyIcon={FileText}
                emptyTitle="No documents"
                items={data.documents.map((d) => ({
                  key: String(d.id),
                  title: d.title,
                  subtitle: fmtDate(d.created_at),
                  href: d.file_url,
                  onDelete: canUpdate ? () => void del(`/documents/${d.id}`) : undefined,
                }))}
              />
            </section>
          </div>
        ) : null}

        {tab === "notes" ? (
          <div className="space-y-4">
            {canUpdate ? (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteBody.trim()) return;
                  void post("/notes", { body: noteBody.trim() }).then(() => setNoteBody(""));
                }}
              >
                <Label>Add note</Label>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Private staff note about this client…"
                />
                <Button type="submit" className="rounded-xl" size="sm">
                  <StickyNote className="h-4 w-4" /> Save note
                </Button>
              </form>
            ) : null}
            <ListSection
              emptyIcon={StickyNote}
              emptyTitle="No notes"
              items={data.notes.map((n) => ({
                key: String(n.id),
                title: n.body,
                subtitle: `${n.author_name ?? "Staff"} · ${fmtWhen(n.created_at)}`,
                onDelete: canUpdate ? () => void del(`/notes/${n.id}`) : undefined,
              }))}
            />
          </div>
        ) : null}

        {tab === "payments" ? (
          <ListSection
            emptyIcon={Smartphone}
            emptyTitle="No payments"
            items={data.payments.map((p) => ({
              key: `${p.source}-${p.id}`,
              title: formatMoney(p.amount_cents, p.currency || currency),
              subtitle: `${p.reference} · ${fmtWhen(p.occurred_at)}`,
              badge: p.status,
            }))}
          />
        ) : null}

        {tab === "loyalty" ? (
          data.loyalty ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <MetricCard title="Points balance" value={String(data.loyalty.points_balance)} icon={Gift} className="min-h-0" />
                <MetricCard title="Lifetime points" value={String(data.loyalty.lifetime_points)} icon={Clock} className="min-h-0" />
              </div>
              <ListSection
                emptyIcon={Gift}
                emptyTitle="No loyalty activity"
                items={data.loyalty.recent_transactions.map((tx) => ({
                  key: String(tx.id),
                  title: tx.description,
                  subtitle: fmtWhen(tx.created_at),
                  badge: `${tx.points > 0 ? "+" : ""}${tx.points}`,
                }))}
              />
            </div>
          ) : (
            <EmptyState icon={Gift} title="No loyalty account" description="Points appear after the client earns rewards." />
          )
        ) : null}

        {tab === "timeline" ? (
          <ListSection
            emptyIcon={History}
            emptyTitle="No timeline events"
            items={data.timeline.map((ev, i) => ({
              key: `${ev.type}-${ev.occurred_at}-${i}`,
              title: ev.title,
              subtitle: `${fmtWhen(ev.occurred_at)} · ${ev.subtitle ?? ev.type}`,
              badge: ev.type,
            }))}
          />
        ) : null}
      </CardContent>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border p-4">
        {canRequestPayment ? (
          <Button className="w-full justify-start gap-2 rounded-xl" variant="outline" onClick={onRequestPayment}>
            <Smartphone className="h-4 w-4" /> Request MoMo payment
          </Button>
        ) : null}
        {canUpdate ? (
          <Button className="w-full justify-start gap-2 rounded-xl" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit client
          </Button>
        ) : null}
        {canDelete ? (
          <ConfirmAction
            label="Remove client"
            confirmLabel="Remove from directory"
            variant="destructive"
            icon={Trash2}
            className="h-10 w-full justify-start gap-2 rounded-xl px-4"
            title="Remove client from directory?"
            confirmMessage={`${data.client.name} will be removed from your client list and marked inactive. Their records are kept.`}
            onConfirm={onRemove}
          />
        ) : null}
      </div>
    </Card>
  );
}
