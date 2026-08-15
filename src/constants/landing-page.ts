import {
  Users,
  Bell,
  PieChart,
  FileBarChart,
  CheckCircle,
  Book,
  GraduationCap,
} from 'lucide-react';

export const features = [
  {
    icon: Users,
    title: 'User Management',
    description:
      'Comprehensive management for students, faculty, and administrators',
  },
  {
    icon: Book,
    title: 'Academic Structure',
    description: 'Programs, courses, batches, sections, and course offerings',
  },
  {
    icon: FileBarChart,
    title: 'Assessments',
    description: 'Complete assessment management with CLO/PLO mapping',
  },
  {
    icon: CheckCircle,
    title: 'Results & Grading',
    description: 'Marks entry, result evaluation, and transcript generation',
  },
  {
    icon: PieChart,
    title: 'OBE Analytics',
    description: 'CLO/PLO/LLO attainment tracking and outcome analysis',
  },
  {
    icon: Bell,
    title: 'Reports & Notifications',
    description: 'Comprehensive reports and real-time notifications',
  },
];

export const statistics = [
  { value: '5000+', label: 'Students' },
  { value: '200+', label: 'Faculty Members' },
  { value: '50+', label: 'Programs' },
];

export const userRoles = [
  {
    icon: GraduationCap,
    title: 'Admin Portal',
    description: 'Complete control over academic operations',
    features: [
      'Manage students, faculty & programs',
      'Configure courses & offerings',
      'Monitor CLO/PLO attainments',
      'Generate comprehensive reports',
    ],
  },
  {
    icon: Book,
    title: 'Faculty Portal',
    description: 'Efficient tools for teaching and assessment',
    features: [
      'Manage course sections',
      'Create & grade assessments',
      'Track student performance',
      'View CLO/PLO analytics',
    ],
  },
  {
    icon: Users,
    title: 'Student Portal',
    description: 'Access to academic information',
    features: [
      'View enrolled courses',
      'Check assessment results',
      'Track CLO/PLO progress',
      'Download transcript',
    ],
  },
];

// `supervisor` and `teamMembers` were removed along with the team section they
// fed. They named the project's academic supervisor and authors as though they
// were the company's staff, and pointed at photographs of them under
// /public/team. Neither belongs on a page selling the product, and nobody named
// there had agreed to appear on one.

