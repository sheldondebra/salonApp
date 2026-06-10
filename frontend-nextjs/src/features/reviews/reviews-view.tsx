"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flag, MessageSquare, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/components/shared/data-table";
import { MetricCard } from "@/components/shared/metric-card";
import { PageTabs } from "@/components/shared/page-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import { Permissions } from "@/lib/auth/permissions";
import { useAbilities } from "@/hooks/use-abilities";
import type { ComplaintCase, Review, ReviewRequest, ReviewSettings } from "@/lib/api/types";

type ReviewsViewProps = {
  tenantSlug: string;
};

export function ReviewsView({ tenantSlug }: ReviewsViewProps) {
  const { can } = useAbilities(tenantSlug);
  const canUpdate = can(Permissions.reviews.update);

  const [tab, setTab] = useState("settings");
  const [settings, setSettings] = useState<ReviewSettings>({
    auto_send: true,
    send_delay_hours: 4,
    min_rating_public: 4,
    collect_private_feedback: true,
    allow_anonymous: false,
    escalation_email: "",
    reply_sla_hours: 24,
  });
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [complaints, setComplaints] = useState<ComplaintCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [settingsRes, requestsRes, reviewsRes, complaintsRes] = await Promise.all([
        client.get<{ data: ReviewSettings }>(`/${tenantSlug}/review-settings`),
        client.get<{ data: ReviewRequest[] }>(`/${tenantSlug}/review-requests?per_page=50`),
        client.get<{ data: Review[] }>(`/${tenantSlug}/reviews?per_page=50`),
        client.get<{ data: ComplaintCase[] }>(`/${tenantSlug}/complaint-cases?per_page=50`),
      ]);
      setSettings(settingsRes.data ?? settingsRes);
      setRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
      setComplaints(Array.isArray(complaintsRes.data) ? complaintsRes.data : []);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not load reviews");
      setRequests([]);
      setReviews([]);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).patch(`/${tenantSlug}/review-settings`, settings);
      toast.success("Review settings saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save review settings");
    } finally {
      setSaving(false);
    }
  }

  async function moderateReview(review: Review, status: string) {
    setSaving(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/reviews/${review.id}/moderate`, {
        status,
      });
      toast.success("Review updated");
      await load();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not update review");
    } finally {
      setSaving(false);
    }
  }

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Average rating" value={averageRating.toFixed(1)} hint={`${reviews.length} reviews`} icon={Star} />
        <MetricCard title="Open requests" value={String(requests.filter((row) => row.status !== "reviewed").length)} icon={MessageSquare} />
        <MetricCard title="Moderation queue" value={String(reviews.filter((row) => ["pending", "flagged"].includes(row.status)).length)} icon={ShieldAlert} />
        <MetricCard title="Complaint cases" value={String(complaints.filter((row) => row.status !== "closed").length)} icon={Flag} />
      </div>

      <PageTabs
        tabs={[
          { id: "settings", label: "Settings" },
          { id: "logs", label: "Request log" },
          { id: "moderation", label: "Moderation inbox" },
          { id: "complaints", label: "Complaints board" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "settings" ? (
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Review automation</CardTitle>
            <CardDescription>Control when review requests send and how low ratings escalate internally.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 text-sm">
              <span>
                <span className="block font-medium">Auto-send requests</span>
                <span className="block text-muted-foreground">Send after completed visits automatically.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.auto_send}
                onChange={(event) => setSettings((current) => ({ ...current, auto_send: event.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 text-sm">
              <span>
                <span className="block font-medium">Collect private feedback</span>
                <span className="block text-muted-foreground">Capture low-score recovery notes before they go public.</span>
              </span>
              <input
                type="checkbox"
                checked={settings.collect_private_feedback}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, collect_private_feedback: event.target.checked }))
                }
              />
            </label>
            <div className="space-y-2">
              <Label>Send delay (hours)</Label>
              <Input
                type="number"
                min={0}
                value={settings.send_delay_hours ?? 0}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, send_delay_hours: Number(event.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Minimum public rating</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={settings.min_rating_public ?? 4}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, min_rating_public: Number(event.target.value) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Escalation email</Label>
              <Input
                value={settings.escalation_email ?? ""}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, escalation_email: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Reply SLA (hours)</Label>
              <Input
                type="number"
                min={1}
                value={settings.reply_sla_hours ?? 24}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, reply_sla_hours: Number(event.target.value) }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Button className="rounded-xl" disabled={!canUpdate || saving} onClick={() => void saveSettings()}>
                {saving ? "Saving…" : "Save settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "logs" ? (
        <DataTable
          columns={[
            { id: "client", header: "Client", mobilePrimary: true, cell: (row) => row.client_name ?? "Client" },
            { id: "channel", header: "Channel", cell: (row) => row.channel },
            { id: "status", header: "Status", cell: (row) => row.status },
            { id: "rating", header: "Rating", cell: (row) => row.rating ?? "—" },
            { id: "sent", header: "Requested", cell: (row) => row.requested_at ? new Date(row.requested_at).toLocaleString() : "Queued" },
          ]}
          data={requests}
          rowKey={(row) => String(row.id)}
          loading={loading}
          emptyIcon={MessageSquare}
          emptyTitle="No review requests yet"
          emptyDescription="Requests appear here after post-visit campaigns begin sending."
        />
      ) : null}

      {tab === "moderation" ? (
        <Card className="rounded-2xl border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle>Moderation inbox</CardTitle>
            <CardDescription>Publish great feedback, flag unsafe content, and hide sensitive complaints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground">No review submissions yet.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{review.author_name || "Anonymous client"}</p>
                      <p className="text-sm text-muted-foreground">{review.title || "Untitled review"}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{Array.from({ length: review.rating }).map(() => "★").join("")}</p>
                      <p className="capitalize text-muted-foreground">{review.status}</p>
                    </div>
                  </div>
                  {review.body ? <p className="mt-3 text-sm text-muted-foreground">{review.body}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={!canUpdate || saving} onClick={() => void moderateReview(review, "published")}>
                      Publish
                    </Button>
                    <Button size="sm" variant="outline" disabled={!canUpdate || saving} onClick={() => void moderateReview(review, "flagged")}>
                      Flag
                    </Button>
                    <Button size="sm" variant="ghost" disabled={!canUpdate || saving} onClick={() => void moderateReview(review, "hidden")}>
                      Hide
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "complaints" ? (
        <DataTable
          columns={[
            {
              id: "reference",
              header: "Case",
              mobilePrimary: true,
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.reference}</p>
                  <p className="text-xs text-muted-foreground">{row.subject}</p>
                </div>
              ),
            },
            { id: "priority", header: "Priority", cell: (row) => row.priority },
            { id: "status", header: "Status", cell: (row) => row.status },
            { id: "owner", header: "Owner", cell: (row) => row.owner_name ?? "Unassigned" },
            { id: "opened", header: "Opened", cell: (row) => row.opened_at ? new Date(row.opened_at).toLocaleDateString() : "Today" },
          ]}
          data={complaints}
          rowKey={(row) => String(row.id)}
          loading={loading}
          emptyIcon={Flag}
          emptyTitle="No complaint cases yet"
          emptyDescription="Escalated complaints appear here for follow-up and closure."
        />
      ) : null}
    </div>
  );
}
