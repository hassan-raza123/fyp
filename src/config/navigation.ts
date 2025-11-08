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
  GraduationCap as FacultyIcon,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
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

// Shared navigation objects to avoid duplication
const adminNavigation = [
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
    title: 'USER MANAGEMENT',
    items: [
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
    title: 'ACADEMIC STRUCTURE',
    items: [
      {
        id: 'programs',
        label: 'Programs',
        icon: School,
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
        id: 'batches',
        label: 'Batches',
        icon: Layers,
        href: '/admin/batches',
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
      {
        id: 'plo-attainments',
        label: 'PLO Attainments',
        icon: TrendingUp,
        href: '/admin/results/plo-attainments',
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

const departmentNavigation = [
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
    title: 'USER MANAGEMENT',
    items: [
      {
        id: 'faculty',
        label: 'Department Faculty',
        icon: FacultyIcon,
        href: '/admin/faculty',
      },
      {
        id: 'students',
        label: 'Department Students',
        icon: GraduationCap,
        href: '/admin/students',
      },
    ],
  },
  {
    title: 'ACADEMIC STRUCTURE',
    items: [
      {
        id: 'programs',
        label: 'Department Programs',
        icon: School,
        href: '/admin/programs',
      },
      {
        id: 'courses',
        label: 'Department Courses',
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
        id: 'batches',
        label: 'Department Batches',
        icon: Layers,
        href: '/admin/batches',
      },
      {
        id: 'sections',
        label: 'Department Sections',
        icon: UserCheck,
        href: '/admin/sections',
      },
    ],
  },
  {
    title: 'LEARNING OUTCOMES',
    items: [
      {
        id: 'plos',
        label: 'Department PLOs',
        icon: Target,
        href: '/admin/plos',
      },
      {
        id: 'clos',
        label: 'Department CLOs',
        icon: FileText,
        href: '/admin/clos',
      },
      {
        id: 'clo-plo-mappings',
        label: 'CLO-PLO Mappings',
        icon: Link,
        href: '/admin/clo-plo-mappings',
      },
      {
        id: 'plo-attainments',
        label: 'PLO Attainments',
        icon: TrendingUp,
        href: '/admin/results/plo-attainments',
      },
    ],
  },
  {
    title: 'ASSESSMENT & RESULTS',
    items: [
      {
        id: 'assessments',
        label: 'Department Assessments',
        icon: ClipboardList,
        href: '/admin/assessments',
      },
      {
        id: 'results',
        label: 'Department Results',
        icon: BarChart2,
        href: '/admin/results',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        id: 'settings',
        label: 'Department Settings',
        icon: Settings2,
        href: '/admin/settings',
      },
    ],
  },
];

export const roleBasedNavigation: RoleBasedNavigation = {
  // Admin navigation (Department Admin)
  admin: departmentNavigation,

  // Teacher has unique navigation
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
      ],
    },
    {
      title: 'SYSTEM',
      items: [
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
          id: 'results',
          label: 'My Results',
          icon: BarChart2,
          href: '/student/results',
        },
        {
          id: 'clo-attainments',
          label: 'My CLO Attainments',
          icon: Target,
          href: '/student/results/clo-attainments',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'settings',
          label: 'Student Settings',
          icon: Settings2,
          href: '/student/settings',
        },
      ],
    },
  ],
};
