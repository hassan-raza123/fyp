'use client';

// components/NavbarClient.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';

interface NavigationItem {
  title: string;
  href: string;
  description: string;
  icon: string;
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

interface SimpleLink {
  href: string;
  label: string;
}

interface NavbarClientProps {
  navigation: NavigationSection[];
  links: SimpleLink[];
}

export function NavbarClient({ navigation, links }: NavbarClientProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`w-full transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16 md:h-20'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            <Link href='/' className='flex items-center gap-x-3'>
              <div className='relative w-10 h-10 overflow-hidden rounded-xl'>
                <div className='absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-600 rotate-3' />
                <div className='absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-700' />
                <span className='relative flex items-center justify-center text-xl font-bold text-white'>
                  U
                </span>
              </div>
              <span
                className={`text-xl font-bold tracking-tight transition-colors ${
                  isScrolled ? 'text-gray-900' : 'text-white'
                }`}
              >
                UniAttend
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden lg:flex lg:items-center lg:gap-x-8'>
            {/* Navigation Dropdowns */}
            {navigation.map((section) => (
              <div key={section.label} className='relative'>
                <button
                  onClick={() =>
                    setOpenDropdown(
                      openDropdown === section.label ? null : section.label
                    )
                  }
                  className={`group inline-flex items-center gap-x-1 text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:text-gray-900'
                      : 'text-gray-100 hover:text-white'
                  }`}
                >
                  {section.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      openDropdown === section.label ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openDropdown === section.label && (
                  <div className='absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 transform'>
                    <div className='overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-900/5'>
                      <div className='p-4'>
                        {section.items.map((item) => (
                          <div
                            key={item.title}
                            className='group relative flex items-center gap-x-6 rounded-lg p-4 text-sm hover:bg-gray-50'
                          >
                            <div className='flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white'>
                              <span className='text-2xl'>{item.icon}</span>
                            </div>
                            <div>
                              <Link
                                href={item.href}
                                className='font-semibold text-gray-900'
                              >
                                {item.title}
                                <span className='absolute inset-0' />
                              </Link>
                              <p className='mt-1 text-gray-600'>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Regular Links */}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isScrolled
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-gray-100 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* CTA Buttons */}
            <div className='flex items-center gap-x-4 ml-4'>
              <Link
                href='/login'
                className={`text-sm font-medium transition-colors ${
                  isScrolled
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-gray-100 hover:text-white'
                }`}
              >
                Log in
              </Link>
              <Link
                href='/signup'
                className='rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              >
                Get started
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className='flex lg:hidden'>
            <button
              type='button'
              className={`-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 ${
                isScrolled ? 'text-gray-700' : 'text-white'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className='sr-only'>Toggle menu</span>
              {mobileMenuOpen ? (
                <X className='h-6 w-6' aria-hidden='true' />
              ) : (
                <Menu className='h-6 w-6' aria-hidden='true' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className='lg:hidden'>
          <div className='fixed inset-0 z-50' />
          <div className='fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10'>
            <div className='flow-root'>
              <div className='-my-6 divide-y divide-gray-500/10'>
                <div className='space-y-2 py-6'>
                  {navigation.map((section) => (
                    <div key={section.label} className='-mx-3'>
                      <button
                        onClick={() =>
                          setOpenDropdown(
                            openDropdown === section.label
                              ? null
                              : section.label
                          )
                        }
                        className='flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50'
                      >
                        {section.label}
                        <ChevronDown
                          className={`h-5 w-5 flex-none ${
                            openDropdown === section.label ? 'rotate-180' : ''
                          }`}
                          aria-hidden='true'
                        />
                      </button>
                      {openDropdown === section.label && (
                        <div className='mt-2 space-y-2'>
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className='block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-50'
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className='-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50'
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className='py-6'>
                  <Link
                    href='/login'
                    className='-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50'
                  >
                    Log in
                  </Link>
                  <Link
                    href='/signup'
                    className='mt-4 block rounded-full bg-primary-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                  >
                    Get started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
