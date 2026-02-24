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
  ShieldCheck,
  ClipboardList,
  Award,
  UserCheck,
  Clock,
  Database,
  PieChart,
  TrendingUp,
  School,
  BookMarked,
  FileSpreadsheet,
  UserPlus,
  FlaskConical,
  GraduationCap as FacultyIcon,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  Lock,
  Unlock,
  Key,
  Mail,
  Phone,
  MapPin,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Server,
  HardDrive,
  Network,
  Wifi,
  Bluetooth,
  Zap,
  Battery,
  Signal,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Video,
  VideoOff,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MessageSquare,
  Send,
  Mail as Email,
  Phone as PhoneIcon,
  MapPin as Location,
  Globe as World,
  Monitor as Desktop,
  Smartphone as Mobile,
  Tablet as TabletIcon,
  Server as ServerIcon,
  HardDrive as Storage,
  Network as NetworkIcon,
  Wifi as WifiIcon,
  Bluetooth as BluetoothIcon,
  Zap as Lightning,
  Battery as BatteryIcon,
  Signal as SignalIcon,
  Volume2 as Volume,
  VolumeX as Mute,
  Mic as Microphone,
  MicOff as MicrophoneOff,
  Camera as CameraIcon,
  Video as VideoIcon,
  VideoOff as VideoOffIcon,
  Image as ImageIcon,
  File as FileIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Archive as ArchiveIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  MessageCircle as MessageCircleIcon,
  MessageSquare as MessageSquareIcon,
  Send as SendIcon,
  Grid,
  Compass,
  Trophy,
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export interface RoleBasedNavigation {
  [key: string]: NavigationSection[];
}

const adminNavigation = [
  {
    title: 'DASHBOARD',
    items: [
      { id: 'overview', label: 'Overview', icon: Home, href: '/admin' },
    ],
  },
  {
    title: 'ACADEMIC STRUCTURE',
    items: [
      {
        id: 'programs',
        label: 'Programs',
        icon: School,
        href: '/admin/programs',
      },
      {
        id: 'semesters',
        label: 'Semesters',
        icon: Calendar,
        href: '/admin/semesters',
      },
      {
        id: 'batches',
        label: 'Batches',
        icon: Layers,
        href: '/admin/batches',
      },
      {
        id: 'courses',
        label: 'Courses',
        icon: BookOpen,
        href: '/admin/courses',
      },
      {
        id: 'curriculum',
        label: 'Program Curriculum',
        icon: BookMarked,
        href: '/admin/curriculum',
      },
      {
        id: 'course-offerings',
        label: 'Course Offerings',
        icon: BookCheck,
        href: '/admin/course-offerings',
      },
      {
        id: 'sections',
        label: 'Sections',
        icon: UserCheck,
        href: '/admin/sections',
      },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      {
        id: 'admins',
        label: 'Admins',
        icon: Shield,
        href: '/admin/admins',
      },
      {
        id: 'faculty',
        label: 'Faculty',
        icon: FacultyIcon,
        href: '/admin/faculty',
      },
      {
        id: 'students',
        label: 'Students',
        icon: GraduationCap,
        href: '/admin/students',
      },
    ],
  },
  {
    title: 'LEARNING OUTCOMES',
    items: [
      {
        id: 'peos',
        label: 'PEOs',
        icon: Trophy,
        href: '/admin/peos',
      },
      {
        id: 'plos',
        label: 'PLOs',
        icon: Target,
        href: '/admin/plos',
      },
      {
        id: 'clos',
        label: 'CLOs',
        icon: FileText,
        href: '/admin/clos',
      },
      {
        id: 'llos',
        label: 'LLOs',
        icon: FileText,
        href: '/admin/llos',
      },
      {
        id: 'peo-plo-mappings',
        label: 'PEO-PLO Mappings',
        icon: Compass,
        href: '/admin/peo-plo-mappings',
      },
      {
        id: 'clo-plo-mappings',
        label: 'CLO-PLO Mappings',
        icon: Link,
        href: '/admin/clo-plo-mappings',
      },
      {
        id: 'llo-plo-mappings',
        label: 'LLO-PLO Mappings',
        icon: Link,
        href: '/admin/llo-plo-mappings',
      },
    ],
  },
  {
    title: 'ASSESSMENT & RESULTS',
    items: [
      {
        id: 'assessments',
        label: 'Assessments',
        icon: ClipboardList,
        href: '/admin/assessments',
      },
      {
        id: 'results',
        label: 'Results',
        icon: BarChart2,
        href: '/admin/results',
      },
      {
        id: 'pass-fail-criteria',
        label: 'Pass/Fail Criteria',
        icon: ShieldCheck,
        href: '/admin/pass-fail-criteria',
      },
      {
        id: 'action-plans',
        label: 'Action Plans',
        icon: TrendingUp,
        href: '/admin/action-plans',
      },
      {
        id: 'graduation',
        label: 'Graduation Tracker',
        icon: GraduationCap,
        href: '/admin/results/graduation',
      },
      {
        id: 'graduation-criteria',
        label: 'Graduation Criteria',
        icon: ShieldCheck,
        href: '/admin/results/graduation-criteria',
      },
      {
        id: 'peo-attainments',
        label: 'PEO Attainments',
        icon: Trophy,
        href: '/admin/results/peo-attainments',
      },
      {
        id: 'bloom-analysis',
        label: "Bloom's Analysis",
        icon: PieChart,
        href: '/admin/results/bloom-analysis',
      },
      {
        id: 'plo-coverage-matrix',
        label: 'CLO-PLO Coverage Matrix',
        icon: Grid,
        href: '/admin/results/plo-coverage-matrix',
      },
    ],
  },
  {
    title: 'REPORTING & DOCUMENTATION',
    items: [
      {
        id: 'reports',
        label: 'OBE Reports',
        icon: FileText,
        href: '/admin/reports',
      },
      {
        id: 'transcripts',
        label: 'Transcripts',
        icon: FileSpreadsheet,
        href: '/admin/transcripts',
      },
      {
        id: 'surveys',
        label: 'Surveys',
        icon: ClipboardList,
        href: '/admin/surveys',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        href: '/admin/notifications',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        id: 'settings',
        label: 'System Settings',
        icon: Settings2,
        href: '/admin/settings',
      },
    ],
  },
];

const superAdminNavigation = [
  {
    title: 'DASHBOARD',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: Home,
        href: '/super-admin',
      },
    ],
  },
  {
    title: 'DEPARTMENT MANAGEMENT',
    items: [
      {
        id: 'departments',
        label: 'Departments',
        icon: Building2,
        href: '/super-admin/departments',
      },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      {
        id: 'admins',
        label: 'Department Admins',
        icon: Shield,
        href: '/super-admin/admins',
      },
      {
        id: 'super-admins',
        label: 'Super Admins',
        icon: Shield,
        href: '/super-admin/super-admins',
      },
    ],
  },
];

export const roleBasedNavigation: RoleBasedNavigation = {
  // Admin navigation
  admin: adminNavigation,
  // Super Admin navigation
  super_admin: superAdminNavigation,

  // Faculty has unique navigation
  faculty: [
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
          id: 'sections',
          label: 'My Sections',
          icon: UserCheck,
          href: '/faculty/sections',
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
      title: 'ASSESSMENT & GRADING',
      items: [
        {
          id: 'assessments',
          label: 'My Assessments',
          icon: ClipboardList,
          href: '/faculty/assessments',
        },
        {
          id: 'results',
          label: 'Grade Management',
          icon: Award,
          href: '/faculty/results',
        },
        {
          id: 'clo-attainments',
          label: 'CLO Attainments',
          icon: Target,
          href: '/faculty/results/clo-attainments',
        },
        {
          id: 'llo-attainments',
          label: 'LLO Attainments',
          icon: FlaskConical,
          href: '/faculty/results/llo-attainments',
        },
        {
          id: 'plo-attainments',
          label: 'PLO Attainments',
          icon: TrendingUp,
          href: '/faculty/results/plo-attainments',
        },
        {
          id: 'surveys',
          label: 'My Surveys',
          icon: ClipboardList,
          href: '/faculty/surveys',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          href: '/faculty/notifications',
        },
        {
          id: 'settings',
          label: 'Faculty Settings',
          icon: Settings2,
          href: '/faculty/settings',
        },
      ],
    },
  ],

  // Student has unique navigation
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
          id: 'assessments',
          label: 'My Assessments',
          icon: ClipboardList,
          href: '/student/assessments',
        },
        {
          id: 'results',
          label: 'My Results',
          icon: BarChart2,
          href: '/student/results',
        },
        {
          id: 'clo-attainments',
          label: 'CLO Attainments',
          icon: Target,
          href: '/student/results/clo-attainments',
        },
        {
          id: 'llo-attainments',
          label: 'LLO Attainments',
          icon: FlaskConical,
          href: '/student/results/llo-attainments',
        },
        {
          id: 'plo-attainments',
          label: 'PLO Attainments',
          icon: TrendingUp,
          href: '/student/results/plo-attainments',
        },
        {
          id: 'surveys',
          label: 'Surveys',
          icon: ClipboardList,
          href: '/student/surveys',
        },
      ],
    },
    {
      title: 'DOCUMENTS & TOOLS',
      items: [
        {
          id: 'transcript',
          label: 'Transcript',
          icon: FileSpreadsheet,
          href: '/student/transcript',
        },
        {
          id: 'calendar',
          label: 'Academic Calendar',
          icon: Calendar,
          href: '/student/calendar',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          href: '/student/notifications',
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: MessageSquare,
          href: '/student/messages',
        },
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
