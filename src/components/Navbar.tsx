'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  UserCircle,
  BookOpen,
  Users,
  Clock,
  BarChart2,
} from 'lucide-react';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    {
      name: 'Dashboard',
      href: '#',
      icon: <BookOpen className='w-5 h-5' />,
      dropdownItems: [
        {
          name: 'My Classes',
          href: '/dashboard/classes',
          description: 'View and manage your class schedules',
        },
        {
          name: 'Attendance Records',
          href: '/dashboard/attendance',
          description: 'Check attendance history and reports',
        },
        {
          name: 'Student Lists',
          href: '/dashboard/students',
          description: 'Manage student information',
        },
      ],
    },
    {
      name: 'Reports',
      href: '#',
      icon: <BarChart2 className='w-5 h-5' />,
      dropdownItems: [
        { name: 'Attendance Analytics', href: '/reports/analytics' },
        { name: 'Monthly Reports', href: '/reports/monthly' },
        { name: 'Department Stats', href: '/reports/department' },
      ],
    },
    {
      name: 'Help Center',
      href: '/help',
      icon: <Users className='w-5 h-5' />,
    },
  ];

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'
      }`}
    >
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between px-4 py-3'>
          {/* Logo */}
          <Link href='/' className='flex items-center space-x-3'>
            <div className='relative w-10 h-10'>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg transform'></div>
              <span className='absolute inset-0 flex items-center justify-center text-xl font-bold text-white'>
                U
              </span>
            </div>
            <span
              className={`text-xl font-bold ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}
            >
              UniAttend
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className='hidden lg:flex items-center space-x-4'>
            {menuItems.map((item) => (
              <div key={item.name} className='relative'>
                {item.dropdownItems ? (
                  <button
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === item.name ? null : item.name
                      )
                    }
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isScrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                    <ChevronDown className='w-4 h-4' />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isScrolled
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )}

                {/* Dropdown Menu */}
                {item.dropdownItems && (
                  <AnimatePresence>
                    {activeDropdown === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className='absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden'
                      >
                        <div className='p-2'>
                          {item.dropdownItems.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.name}
                              href={dropdownItem.href}
                              className='flex flex-col px-4 py-3 rounded-lg hover:bg-gray-50'
                            >
                              <span className='text-sm font-medium text-gray-900'>
                                {dropdownItem.name}
                              </span>
                              {/* {dropdownItem.description && (
                                <span className='text-xs text-gray-500 mt-1'>
                                  {dropdownItem.description}
                                </span>
                              )} */}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}

            {/* Profile/Login Button */}
            <Link
              href='/login'
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isScrolled
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              <UserCircle className='w-5 h-5' />
              <span>Sign In</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='lg:hidden p-2 rounded-lg text-gray-600'
          >
            {isMenuOpen ? (
              <X className='w-6 h-6' />
            ) : (
              <Menu className='w-6 h-6' />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='lg:hidden bg-white border-t border-gray-100'
            >
              <div className='px-4 py-6 space-y-4'>
                {menuItems.map((item) => (
                  <div key={item.name}>
                    {item.dropdownItems ? (
                      <button
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === item.name ? null : item.name
                          )
                        }
                        className='flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg'
                      >
                        <div className='flex items-center space-x-2'>
                          {item.icon}
                          <span>{item.name}</span>
                        </div>
                        <ChevronDown className='w-4 h-4' />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className='flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg'
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    )}

                    {/* Mobile Dropdown */}
                    {item.dropdownItems && activeDropdown === item.name && (
                      <div className='mt-2 ml-4 space-y-2'>
                        {item.dropdownItems.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.name}
                            href={dropdownItem.href}
                            className='block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg'
                          >
                            {dropdownItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Mobile Profile/Login Button */}
                <Link
                  href='/login'
                  className='flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
                >
                  <UserCircle className='w-5 h-5' />
                  <span>Sign In</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
