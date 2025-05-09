export default function PropertyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* O head está sendo gerenciado pela metadata no page.tsx */}
      {children}
    </>
  );
}