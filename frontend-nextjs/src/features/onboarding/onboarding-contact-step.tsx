"use client";

import { Globe, Mail, Phone, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldWithIcon } from "@/components/onboarding/field-with-icon";
import type { OnboardingExtraContact } from "./types";

const MAX_EXTRA_CONTACTS = 3;

const EMPTY_EXTRA: OnboardingExtraContact = {
  label: "",
  phone: "",
  email: "",
};

type Props = {
  businessPhone: string;
  businessEmail: string;
  extraContacts: OnboardingExtraContact[];
  instagram: string;
  facebook: string;
  tiktok: string;
  onBusinessPhoneChange: (value: string) => void;
  onBusinessEmailChange: (value: string) => void;
  onExtraContactsChange: (contacts: OnboardingExtraContact[]) => void;
  onInstagramChange: (value: string) => void;
  onFacebookChange: (value: string) => void;
  onTiktokChange: (value: string) => void;
};

export function OnboardingContactStep({
  businessPhone,
  businessEmail,
  extraContacts,
  instagram,
  facebook,
  tiktok,
  onBusinessPhoneChange,
  onBusinessEmailChange,
  onExtraContactsChange,
  onInstagramChange,
  onFacebookChange,
  onTiktokChange,
}: Props) {
  function updateExtra(index: number, patch: Partial<OnboardingExtraContact>) {
    onExtraContactsChange(
      extraContacts.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function addExtra() {
    if (extraContacts.length >= MAX_EXTRA_CONTACTS) return;
    onExtraContactsChange([...extraContacts, { ...EMPTY_EXTRA }]);
  }

  function removeExtra(index: number) {
    onExtraContactsChange(extraContacts.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm font-medium">Primary contact</p>
        <FieldWithIcon label="Business phone" icon={Phone}>
          <Input
            placeholder="+233 20 123 4567"
            value={businessPhone}
            onChange={(e) => onBusinessPhoneChange(e.target.value)}
          />
        </FieldWithIcon>
        <FieldWithIcon label="Business email" icon={Mail}>
          <Input
            type="email"
            placeholder="hello@missionsalon.com"
            value={businessEmail}
            onChange={(e) => onBusinessEmailChange(e.target.value)}
          />
        </FieldWithIcon>
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Additional contacts</p>
            <p className="text-xs text-muted-foreground">
              Add up to {MAX_EXTRA_CONTACTS} more (e.g. reception, manager, bookings)
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExtra}
            disabled={extraContacts.length >= MAX_EXTRA_CONTACTS}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add contact
          </Button>
        </div>

        {extraContacts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
            No extra contacts yet. Use &quot;Add contact&quot; for a second or third line.
          </p>
        ) : null}

        {extraContacts.map((row, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-accent" />
                Contact {index + 2}
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeExtra(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <FieldWithIcon label="Role or label" icon={User}>
              <Input
                placeholder="e.g. Reception, Manager, Bookings"
                value={row.label}
                onChange={(e) => updateExtra(index, { label: e.target.value })}
              />
            </FieldWithIcon>
            <FieldWithIcon label="Phone" icon={Phone}>
              <Input
                placeholder="+233 24 000 0000"
                value={row.phone}
                onChange={(e) => updateExtra(index, { phone: e.target.value })}
              />
            </FieldWithIcon>
            <FieldWithIcon label="Email" icon={Mail}>
              <Input
                type="email"
                placeholder="contact@missionsalon.com"
                value={row.email}
                onChange={(e) => updateExtra(index, { email: e.target.value })}
              />
            </FieldWithIcon>
          </div>
        ))}
      </div>

      <div className="space-y-4 border-t border-border pt-4">
        <p className="text-sm font-medium">Social media</p>
        <FieldWithIcon label="Instagram" icon={Globe}>
          <Input placeholder="@yourhandle" value={instagram} onChange={(e) => onInstagramChange(e.target.value)} />
        </FieldWithIcon>
        <FieldWithIcon label="Facebook" icon={Globe}>
          <Input
            placeholder="facebook.com/yourpage"
            value={facebook}
            onChange={(e) => onFacebookChange(e.target.value)}
          />
        </FieldWithIcon>
        <FieldWithIcon label="TikTok" icon={Globe}>
          <Input placeholder="@yourtiktok" value={tiktok} onChange={(e) => onTiktokChange(e.target.value)} />
        </FieldWithIcon>
      </div>
    </div>
  );
}
