import React from 'react';
import {
  Users,
  Clock,
  Bell,
  PieChart,
  FileSpreadsheet,
  Shield,
  Calendar,
  UserCheck,
  Database,
  LineChart,
} from 'lucide-react';

const features = [
  {
    icon: <Users className='h-8 w-8' />,
    title: 'Multi-Role Management',
    description:
      'Specialized interfaces for administrators, teachers, and students with role-based access control',
  },
  {
    icon: <Clock className='h-8 w-8' />,
    title: 'Real-Time Tracking',
    description:
      'Mark and monitor attendance in real-time with instant updates and synchronization',
  },
  {
    icon: <Bell className='h-8 w-8' />,
    title: 'Smart Notifications',
    description:
      'Automated alerts for absences, low attendance, and important updates',
  },
  {
    icon: <PieChart className='h-8 w-8' />,
    title: 'Advanced Analytics',
    description:
      'Comprehensive dashboards with attendance patterns and performance metrics',
  },
  {
    icon: <FileSpreadsheet className='h-8 w-8' />,
    title: 'Bulk Operations',
    description:
      'Efficient tools for handling multiple records with batch processing capabilities',
  },
  {
    icon: <Shield className='h-8 w-8' />,
    title: 'Secure Access',
    description:
      'Enterprise-grade security with role-based permissions and audit trails',
  },
  {
    icon: <Calendar className='h-8 w-8' />,
    title: 'Schedule Management',
    description:
      'Flexible scheduling system with conflict detection and resolution',
  },
  {
    icon: <Database className='h-8 w-8' />,
    title: 'Data Integration',
    description:
      'Seamless integration with existing university management systems',
  },
];

const statistics = [
  {
    icon: <UserCheck className='h-8 w-8' />,
    value: '99.9%',
    label: 'Accuracy Rate',
  },
  {
    icon: <Clock className='h-8 w-8' />,
    value: '50%',
    label: 'Time Saved',
  },
  {
    icon: <LineChart className='h-8 w-8' />,
    value: '85%',
    label: 'Improved Tracking',
  },
];

export default function Features() {
  return (
    <div className='min-h-screen bg-white'>
      {/* Header Section */}
      <div className='relative bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900'>
        <div className='absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]' />
        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20'>
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-bold text-white mb-6'>
              Powerful Features for Modern
              <br />
              Attendance Management
            </h1>
            <p className='text-xl text-indigo-100 mb-10 max-w-3xl mx-auto'>
              Discover how our comprehensive suite of features transforms
              attendance tracking from a daily chore into a strategic asset
            </p>
          </div>
        </div>

        {/* Wave SVG */}
        <div className='absolute bottom-0 left-0 right-0'>
          <svg
            viewBox='0 0 1440 120'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M0 30L48 35C96 40 192 50 288 55C384 60 480 60 576 55C672 50 768 40 864 45C960 50 1056 70 1152 75C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V30Z'
              fill='white'
            />
          </svg>
        </div>
      </div>

      {/* Features Grid */}
      <div className='py-24 bg-gradient-to-b from-gray-50 to-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Everything You Need
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              A complete solution designed to streamline attendance management
              at every level
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.map((feature, index) => (
              <div
                key={index}
                className='bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100'
              >
                <div className='text-indigo-600 bg-indigo-50 p-4 rounded-xl inline-block mb-6'>
                  {feature.icon}
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-3'>
                  {feature.title}
                </h3>
                <p className='text-gray-600 leading-relaxed'>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className='bg-indigo-900 py-24'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {statistics.map((stat, index) => (
              <div
                key={index}
                className='bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center'
              >
                <div className='text-indigo-400 mb-4 flex justify-center'>
                  {stat.icon}
                </div>
                <div className='text-4xl font-bold text-white mb-2'>
                  {stat.value}
                </div>
                <div className='text-indigo-200'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
