// src/components/layout/DashboardLayout.tsx
import { Fragment, ReactNode, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BriefcaseIcon,
  ChartBarIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  BeakerIcon,
  LightBulbIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  ChevronDownIcon,
  BellIcon,
} from '@heroicons/react/20/solid';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/firebase/auth';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: router.pathname === '/dashboard' },
    { name: 'Projects', href: '/projects', icon: BriefcaseIcon, current: router.pathname.startsWith('/projects') },
    { name: 'Documents', href: '/documents', icon: DocumentIcon, current: router.pathname.startsWith('/documents') },
    { name: 'Research', href: '/research', icon: MagnifyingGlassIcon, current: router.pathname.startsWith('/research') },
    { name: 'Insights', href: '/insights', icon: LightBulbIcon, current: router.pathname.startsWith('/insights') },
    { name: 'Team', href: '/team', icon: UsersIcon, current: router.pathname.startsWith('/team') },
  ];
  
  const userNavigation = [
    { name: 'Your Profile', href: '/profile' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <>
      <div>
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-neutral-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  
                  <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary-700 px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                      <div className="text-white text-xl font-bold">Agency Strategy</div>
                    </div>
                    <nav className="flex flex-1 flex-col">
                      <ul role="list" className="flex flex-1 flex-col gap-y-7">
                        <li>
                          <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => (
                              <li key={item.name}>
                                <Link
                                  href={item.href}
                                  className={classNames(
                                    item.current
                                      ? 'bg-primary-800 text-white'
                                      : 'text-primary-100 hover:text-white hover:bg-primary-800',
                                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                                  )}
                                >
                                  <item.icon
                                    className={classNames(
                                      item.current ? 'text-white' : 'text-primary-200 group-hover:text-white',
                                      'h-6 w-6 shrink-0'
                                    )}
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary-700 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
              <div className="text-white text-xl font-bold">Agency Strategy</div>
            </div>
            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            item.current
                              ? 'bg-primary-800 text-white'
                              : 'text-primary-100 hover:text-white hover:bg-primary-800',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                          )}
                        >
                          <item.icon
                            className={classNames(
                              item.current ? 'text-white' : 'text-primary-200 group-hover:text-white',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="mt-auto">
                  <a
                    href="#"
                    className="text-primary-100 hover:text-white hover:bg-primary-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                  >
                    <BeakerIcon className="h-6 w-6 shrink-0 text-primary-200 group-hover:text-white" aria-hidden="true" />
                    Help & Support
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="lg:pl-72">
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-neutral-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button type="button" className="-m-2.5 p-2.5 text-neutral-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="h-6 w-px bg-neutral-200 lg:hidden" aria-hidden="true" />

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
                <button type="button" className="-m-2.5 p-2.5 text-neutral-400 hover:text-neutral-500">
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button>

                {/* Separator */}
                <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-neutral-200" aria-hidden="true" />

                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <Menu.Button className="-m-1.5 flex items-center p-1.5">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center">
                      {userProfile?.photoURL ? (
                        <Image
                          src={userProfile.photoURL}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-medium text-neutral-600">
                          {userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <span className="hidden lg:flex lg:items-center">
                      <span className="ml-4 text-sm font-semibold leading-6 text-neutral-900" aria-hidden="true">
                        {userProfile?.displayName || user?.email}
                      </span>
                      <ChevronDownIcon className="ml-2 h-5 w-5 text-neutral-400" aria-hidden="true" />
                    </span>
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-neutral-900/5 focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <Link
                              href={item.href}
                              className={classNames(
                                active ? 'bg-neutral-50' : '',
                                'block px-3 py-1 text-sm leading-6 text-neutral-900'
                              )}
                            >
                              {item.name}
                            </Link>
                          )}
                        </Menu.Item>
                      ))}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={classNames(
                              active ? 'bg-neutral-50' : '',
                              'block w-full text-left px-3 py-1 text-sm leading-6 text-neutral-900'
                            )}
                            onClick={handleSignOut}
                          >
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            </div>
          </div>

          <main className="py-10">
            <div className="px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-semibold leading-7 text-neutral-900 mb-6">{title}</h1>
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}