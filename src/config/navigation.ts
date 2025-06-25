import {
  Home,
  BarChart2,
  Users,
  Layers,
  Building2,
  GraduationCap,
  BookOpen,
  BookCheck,
  Calendar,
  Target,
  FileText,
  Link,
  Settings2,
  Shield,
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export interface RoleBasedNavigation {
  [key: string]: NavigationSection[];
}

export const roleBasedNavigation: RoleBasedNavigation = {
  super_admin: [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, href: '/admin' },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart2,
          href: '/admin/analytics',
        },
      ],
    },
    {
      title: 'STUDENT MANAGEMENT',
      items: [
        {
          id: 'students',
          label: 'Students',
          icon: Users,
          href: '/admin/students',
        },
        {
          id: 'batches',
          label: 'Batches',
          icon: Layers,
          href: '/admin/batches',
        },
      ],
    },
    {
      title: 'ACADEMIC STRUCTURE',
      items: [
        {
          id: 'departments',
          label: 'Departments',
          icon: Building2,
          href: '/admin/departments',
        },
        {
          id: 'programs',
          label: 'Programs',
          icon: GraduationCap,
          href: '/admin/programs',
        },
        {
          id: 'courses',
          label: 'Courses',
          icon: BookOpen,
          href: '/admin/courses',
        },
        {
          id: 'course-offerings',
          label: 'Course Offerings',
          icon: BookCheck,
          href: '/admin/course-offerings',
        },
        {
          id: 'semesters',
          label: 'Semesters',
          icon: Calendar,
          href: '/admin/semesters',
        },
        {
          id: 'sections',
          label: 'Sections',
          icon: Users,
          href: '/admin/sections',
        },
      ],
    },
    {
      title: 'LEARNING OUTCOMES',
      items: [
        { id: 'plos', label: 'PLOs', icon: Target, href: '/admin/plos' },
        { id: 'clos', label: 'CLOs', icon: FileText, href: '/admin/clos' },
        {
          id: 'clo-plo-mappings',
          label: 'CLO-PLO Mappings',
          icon: Link,
          href: '/admin/clo-plo-mappings',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings2,
          href: '/admin/settings',
        },
      ],
    },
  ],
  sub_admin: [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, href: '/admin' },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart2,
          href: '/admin/analytics',
        },
      ],
    },
    {
      title: 'STUDENT MANAGEMENT',
      items: [
        {
          id: 'students',
          label: 'Students',
          icon: Users,
          href: '/admin/students',
        },
        {
          id: 'batches',
          label: 'Batches',
          icon: Layers,
          href: '/admin/batches',
        },
      ],
    },
    {
      title: 'ACADEMIC STRUCTURE',
      items: [
        {
          id: 'departments',
          label: 'Departments',
          icon: Building2,
          href: '/admin/departments',
        },
        {
          id: 'programs',
          label: 'Programs',
          icon: GraduationCap,
          href: '/admin/programs',
        },
        {
          id: 'courses',
          label: 'Courses',
          icon: BookOpen,
          href: '/admin/courses',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'users', label: 'Users', icon: Users, href: '/admin/users' },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings2,
          href: '/admin/settings',
        },
      ],
    },
  ],
  department_admin: [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, href: '/department' },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart2,
          href: '/department/analytics',
        },
      ],
    },
    {
      title: 'STUDENT MANAGEMENT',
      items: [
        {
          id: 'students',
          label: 'Students',
          icon: Users,
          href: '/department/students',
        },
        {
          id: 'batches',
          label: 'Batches',
          icon: Layers,
          href: '/department/batches',
        },
      ],
    },
    {
      title: 'ACADEMIC STRUCTURE',
      items: [
        {
          id: 'programs',
          label: 'Programs',
          icon: GraduationCap,
          href: '/department/programs',
        },
        {
          id: 'courses',
          label: 'Courses',
          icon: BookOpen,
          href: '/department/courses',
        },
        {
          id: 'course-offerings',
          label: 'Course Offerings',
          icon: BookCheck,
          href: '/department/course-offerings',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings2,
          href: '/department/settings',
        },
      ],
    },
  ],
  teacher: [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, href: '/faculty' },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart2,
          href: '/faculty/analytics',
        },
      ],
    },
    {
      title: 'COURSE MANAGEMENT',
      items: [
        {
          id: 'my-courses',
          label: 'My Courses',
          icon: BookOpen,
          href: '/faculty/courses',
        },
        {
          id: 'course-offerings',
          label: 'Course Offerings',
          icon: BookCheck,
          href: '/faculty/course-offerings',
        },
      ],
    },
    {
      title: 'STUDENT MANAGEMENT',
      items: [
        {
          id: 'my-students',
          label: 'My Students',
          icon: Users,
          href: '/faculty/students',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings2,
          href: '/faculty/settings',
        },
      ],
    },
  ],
  student: [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'overview', label: 'Overview', icon: Home, href: '/student' },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: BarChart2,
          href: '/student/analytics',
        },
      ],
    },
    {
      title: 'ACADEMICS',
      items: [
        {
          id: 'my-courses',
          label: 'My Courses',
          icon: BookOpen,
          href: '/student/courses',
        },
        {
          id: 'course-offerings',
          label: 'Course Offerings',
          icon: BookCheck,
          href: '/student/course-offerings',
        },
        {
          id: 'results',
          label: 'Results',
          icon: BarChart2,
          href: '/student/results',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings2,
          href: '/student/settings',
        },
      ],
    },
  ],
};
