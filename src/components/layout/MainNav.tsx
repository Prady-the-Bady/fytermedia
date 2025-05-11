'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import { FaHome, FaSearch, FaPlus, FaBell, FaUser, FaSignOutAlt, FaComment, FaVideo } from 'react-icons/fa';
import NotificationBadge from '../ui/NotificationBadge';

const navItems = [
  { href: '/feed', label: 'Feed', icon: FaHome },
  { href: '/discover', label: 'Discover', icon: FaSearch },
  { href: '/create', label: 'Create', icon: FaPlus },
  { href: '/messages', label: 'Messages', icon: FaComment },
  { href: '/reels', label: 'Reels', icon: FaVideo },
  { href: '/notifications', label: 'Notifications', icon: FaBell, custom: true },
  { href: '/profile', label: 'Profile', icon: FaUser },
];

export default function MainNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrollY, setScrollY] = useState(0);

  // Update scroll position for glass effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Only show navigation when logged in
  if (!session) return null;

  return (
    <>
      {/* Mobile navigation (bottom bar) */}
      <motion.nav
        className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-gray-800 bg-black/80 px-2 py-3 backdrop-blur-lg sm:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href}>
              <div className="flex flex-col items-center">
                <motion.div
                  className={`relative rounded-full p-2 ${
                    isActive ? 'bg-indigo-600' : 'bg-gray-800/60'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="h-5 w-5 text-white" />
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-indigo-500 opacity-30 blur-md"
                      layoutId="mobileNavHighlight"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
                {isActive && (
                  <motion.div
                    className="mt-1 h-1 w-1 rounded-full bg-indigo-500"
                    layoutId="mobileNavDot"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </motion.nav>

      {/* Desktop navigation (sidebar) */}
      <motion.div
        className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-gray-800 bg-black/80 backdrop-blur-lg sm:flex"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          backgroundColor: `rgba(0, 0, 0, ${Math.min(0.8 + scrollY / 1000, 0.95)})`,
        }}
      >
        <div className="flex h-16 items-center px-6">
          <h1 className="text-2xl font-bold text-white">
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              FutureMedia
            </span>
          </h1>
        </div>

        <div className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link href={item.href} key={item.href}>
                <motion.div
                  className={`flex items-center space-x-3 rounded-lg px-4 py-3 text-sm ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 text-white'
                      : 'text-gray-400 hover:bg-gray-800/30 hover:text-white'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative">
                    {item.custom && item.label === 'Notifications' ? (
                      <NotificationBadge />
                    ) : (
                      <>
                        <item.icon className="h-5 w-5" />
                        {isActive && (
                          <motion.div
                            className="absolute -inset-1 rounded-full bg-indigo-500 opacity-30 blur-sm"
                            layoutId="desktopNavHighlight"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </>
                    )}
                  </div>
                  {!item.custom && <span>{item.label}</span>}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 h-8 w-1 rounded-r-full bg-indigo-500"
                      layoutId="desktopNavIndicator"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="p-4">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm text-gray-400 hover:bg-gray-800/30 hover:text-white"
          >
            <FaSignOutAlt className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </>
  );
}
