import OwnerNavbar from "@/components/ui/OwnerNavbar";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OwnerNavbar />
      {children}
    </>
  );
}
