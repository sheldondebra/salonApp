"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartCardProps = {
  title: string;
  description?: string;
  heightClass?: string;
  children: React.ReactNode;
};

export function ChartCard({
  title,
  description,
  heightClass = "h-72",
  children,
}: ChartCardProps) {
  return (
    <Card className="rounded-2xl border-border/60 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className={heightClass}>{children}</CardContent>
    </Card>
  );
}
