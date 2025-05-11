'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaUserCircle } from 'react-icons/fa';
import { api } from '@/lib/trpc/client';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      setIsLoading(false);
      return;
    }

    try {
      // Register user using tRPC
      await api.user.register.mutate({
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });

      // Redirect to login page on success
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950">
      <div className="relative w-full max-w-md">
        {/* 3D Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-purple-500 opacity-10 blur-3xl"
            initial={{ scale: 0.8 }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{ repeat: Infinity, duration: 12 }}
          />
          <motion.div
            className="absolute -bottom-20 -right-10 h-60 w-60 rounded-full bg-blue-500 opacity-10 blur-3xl"
            initial={{ scale: 0.8 }}
            animate={{
              scale: [0.8, 1.3, 0.8],
              x: [0, -25, 0],
              y: [0, 25, 0],
            }}
            transition={{ repeat: Infinity, duration: 15, delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/3 h-24 w-24 rounded-full bg-fuchsia-500 opacity-10 blur-3xl"
            initial={{ scale: 0.8 }}
            animate={{
              scale: [0.8, 1.1, 0.8],
              x: [0, 25, 0],
              y: [0, 15, 0],
            }}
            transition={{ repeat: Infinity, duration: 10, delay: 2 }}
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
            <h1 className="text-center text-3xl font-bold text-white">Join FutureMedia</h1>
            <p className="mt-2 text-center text-gray-300">Create your account</p>
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-300">
                  <FaUser className="mr-2" />
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Your Name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-300">
                  <FaEnvelope className="mr-2" />
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="username" className="flex items-center text-sm font-medium text-gray-300">
                  <FaUserCircle className="mr-2" />
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="username"
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/50 px-3 py-2 text-white placeholder-gray-400 backdrop-blur-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="flex items-center text-sm font-medium text-gray-300">
                  <FaLock className="mr-2" />
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-center font-medium text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </motion.button>
            </form>
          </motion.div>

          <motion.p
            className="mt-8 text-center text-sm text-gray-400"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
