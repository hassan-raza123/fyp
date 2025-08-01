import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DepartmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
