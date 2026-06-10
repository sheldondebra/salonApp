"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiClient, ApiError } from "@/lib/api/client";
import { getApiClientOptions } from "@/lib/auth/session";
import type { Location, Service, StaffMember } from "@/lib/api/types";

type WaitlistAddDialogProps = {
  tenantSlug: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

function normalizeList<T>(res: { data?: T[] | { data?: T[] } }): T[] {
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && "data" in d && Array.isArray(d.data)) return d.data;
  return [];
}

export function WaitlistAddDialog({ tenantSlug, open, onClose, onCreated }: WaitlistAddDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [staffId, setStaffId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [preferredDate, setPreferredDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [preferredTime, setPreferredTime] = useState("");
  const [priority, setPriority] = useState("0");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");

  const loadMeta = useCallback(async () => {
    setLoading(true);
    try {
      const client = createApiClient(getApiClientOptions());
      const [svcRes, staffRes, locRes] = await Promise.all([
        client.get<{ data: Service[] }>(`/${tenantSlug}/services?per_page=100&is_active=1`),
        client.get<{ data: StaffMember[] }>(`/${tenantSlug}/staff-members?per_page=100&is_active=1`),
        client.get<{ data: Location[] }>(`/${tenantSlug}/locations`).catch(() => ({ data: [] as Location[] })),
      ]);
      setServices(normalizeList(svcRes));
      setStaff(normalizeList(staffRes).filter((m) => m.is_bookable !== false));
      setLocations(normalizeList(locRes));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not load form data");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (open) void loadMeta();
  }, [open, loadMeta]);

  function toggleService(id: number) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    if (serviceIds.length === 0 || !clientName.trim() || !clientEmail.trim()) {
      toast.error("Select services and enter client name and email");
      return;
    }
    setSubmitting(true);
    try {
      await createApiClient(getApiClientOptions()).post(`/${tenantSlug}/waitlist`, {
        service_ids: serviceIds,
        staff_member_id: staffId ? Number(staffId) : null,
        location_id: locationId ? Number(locationId) : null,
        preferred_date: preferredDate,
        preferred_time: preferredTime || null,
        priority: Number(priority) || 0,
        client_name: clientName.trim(),
        client_email: clientEmail.trim(),
        client_phone: clientPhone.trim() || null,
        notes: notes.trim() || null,
      });
      toast.success("Added to waitlist");
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not add to waitlist");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-soft max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add to waitlist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : (
            <>
              <div>
                <Label>Services</Label>
                <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        serviceIds.includes(s.id) ? "border-primary bg-primary/10 text-primary" : "border-border"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Preferred date</Label>
                  <Input type="date" className="mt-1 rounded-xl" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
                </div>
                <div>
                  <Label>Preferred time</Label>
                  <Input type="time" className="mt-1 rounded-xl" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Staff (optional)</Label>
                  <select className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                    <option value="">Any</option>
                    {staff.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                {locations.length > 0 ? (
                  <div>
                    <Label>Branch</Label>
                    <select className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
                      <option value="">Any</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
              <div>
                <Label>Priority (0–999, higher = sooner)</Label>
                <Input type="number" min={0} max={999} className="mt-1 rounded-xl" value={priority} onChange={(e) => setPriority(e.target.value)} />
              </div>
              <div>
                <Label>Client name</Label>
                <Input className="mt-1 rounded-xl" value={clientName} onChange={(e) => setClientName(e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" className="mt-1 rounded-xl" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input className="mt-1 rounded-xl" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input className="mt-1 rounded-xl" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </>
          )}
          <div className="flex gap-2 pt-2">
            <Button className="flex-1 rounded-xl" disabled={submitting || loading} onClick={() => void submit()}>
              {submitting ? "Saving…" : "Add to waitlist"}
            </Button>
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
