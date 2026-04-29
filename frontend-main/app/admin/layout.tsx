import AdminNavbar from "@/components/ui/AdminNavbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminNavbar />
      {children}
    </>
  );
}
