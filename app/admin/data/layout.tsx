import { AdminLayout } from "@/components/admin/admin-layout"

export default function DataLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
