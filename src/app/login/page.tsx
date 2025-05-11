'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaGithub, FaGoogle, FaEnvelope, FaLock } from 'react-icons/fa';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/feed');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950">
      <div className="relative w-full max-w-md">
        {/* 3D Floating Orbs Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-10 left-10 h-24 w-24 rounded-full bg-purple-400 opacity-20 blur-xl"
            initial={{ scale: 0.8 }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              x: [0, 10, 0],
              y: [0, -10, 0],
            }}
            transition={{ repeat: Infinity, duration: 8 }}
          />
          <motion.div
            className="absolute bottom-20 right-10 h-32 w-32 rounded-full bg-indigo-400 opacity-20 blur-xl"
            initial={{ scale: 0.8 }}
            animate={{
              scale: [0.8, 1.3, 0.8],
              x: [0, -15, 0],
              y: [0, 15, 0],
            }}
            transition={{ repeat: Infinity, duration: 10, delay: 1 }}
          />
          <motion.div
            className="absolute top-32 right-20 h-16 w-16 rounded-full bg-pink-400 opacity-30 blur-xl"
            initial={{ scale: 0.8 }}
            animate={{
              scale: [0.8, 1.1, 0.8],
              x: [0, 15, 0],
              y: [0, 10, 0],
            }}
            transition={{ repeat: Infinity, duration: 7, delay: 2 }}
          />
        </div>

        {/* Card */}
        <motion.div
          className="relative z-10 w-full overflow-hidden rounded-2xl bg-black/30 p-8 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <h1 className="text-center text-3xl font-bold text-white">FutureMedia</h1>
            <p className="mt-2 text-center text-gray-300">Sign in to your account</p>
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-300">
                  <FaEnvelope className="mr-2" />
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-300">
                  <FaLock className="mr-2" />
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-md bg-red-900/50 p-3 text-red-200"
                >
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-center font-medium text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-black/30 px-2 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                className="flex w-full items-center justify-center rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2 text-gray-300 shadow-sm backdrop-blur-sm hover:bg-gray-700/50"
                onClick={() => signIn('github', { callbackUrl: '/feed' })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaGithub className="mr-2 h-5 w-5" />
                <span>GitHub</span>
              </motion.button>

              <motion.button
                type="button"
                className="flex w-full items-center justify-center rounded-lg border border-gray-600 bg-gray-800/50 px-4 py-2 text-gray-300 shadow-sm backdrop-blur-sm hover:bg-gray-700/50"
                onClick={() => signIn('google', { callbackUrl: '/feed' })}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FaGoogle className="mr-2 h-5 w-5" />
                <span>Google</span>
              </motion.button>
            </div>
          </motion.div>

          <motion.p
            className="mt-8 text-center text-sm text-gray-400"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Sign up
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
