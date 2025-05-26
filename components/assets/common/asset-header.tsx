"use client";

import { ReactNode } from "react";

interface AssetHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function AssetHeader({ title, description, children }: AssetHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}