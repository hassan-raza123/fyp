import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
