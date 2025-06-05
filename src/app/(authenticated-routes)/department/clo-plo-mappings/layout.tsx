import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CLO-PLO Mappings',
  description:
    'Manage Course Learning Outcomes (CLO) and Program Learning Outcomes (PLO) mappings',
};

export default function CLOPLOMappingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
