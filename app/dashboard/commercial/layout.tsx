import { SiteHeader } from "@/components/dashboard/site-header";

export default async function CommercialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Comercial" />

      <div className=" space-y-6">
        <div className="w-full">
          <div className="px-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
