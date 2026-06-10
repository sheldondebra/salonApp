"use client";

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Review } from "@/lib/api/types";

export function PublicReviewsSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight">Recent reviews</h3>
        <p className="text-sm text-muted-foreground sm:text-base">
          What clients are saying about their visits.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 4).map((review) => (
          <Card key={review.id} className="rounded-2xl border-border/60 shadow-soft">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{review.author_name || "Guest client"}</p>
                  <p className="text-xs text-muted-foreground">{review.title || "Client review"}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
                </div>
              </div>
              {review.body ? (
                <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
