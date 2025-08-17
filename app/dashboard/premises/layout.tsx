import { ReactNode } from "react";
import { SiteHeader } from "@/components/dashboard/site-header";

export default function PremisesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader title="Premissas" />
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}