'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '../firebase'; // Adjust path if your firebase.js moves
import { useRouter } from 'next/navigation';

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => setUser(u));
    return unsubscribe;
  }, []);

  // Apply theme on mount based on localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      enableDarkMode();
    } else if (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      enableDarkMode();
    } else {
      disableDarkMode();
    }
  }, []);

  const enableDarkMode = () => {
    document.documentElement.classList.add('dark');
    setIsDarkMode(true);
    localStorage.setItem('theme', 'dark');
  };

  const disableDarkMode = () => {
    document.documentElement.classList.remove('dark');
    setIsDarkMode(false);
    localStorage.setItem('theme', 'light');
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (err) {
      alert('Logout failed: ' + err.message);
    }
  };

  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-var-bg-color dark:bg-gray-900 text-var-text-color dark:text-gray-100 transition-colors duration-300">
        <header className="bg-white dark:bg-gray-900 shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-50 transition-colors duration-300">
          <Link
            href="/"
            className="text-2xl font-semibold text-[var(--primary-color)] dark:text-[var(--primary-dark)] tracking-tight select-none"
            aria-label="Homepage"
          >
            NoteAlly
          </Link>
          <nav className="space-x-4 flex items-center">
            <Link
              href="/notes"
              className="text-[var(--primary-color)] dark:text-[var(--primary-dark)] font-medium hover:underline focus:underline transition"
            >
              Browse Notes
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-[var(--primary-color)] dark:text-[var(--primary-dark)] font-medium hover:underline focus:underline transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/upload"
                  className="ml-4 bg-[var(--primary-color)] dark:bg-[var(--primary-dark)] text-white py-2 px-4 rounded-full font-medium shadow hover:opacity-90 focus:ring-2 focus:ring-[var(--primary-color)] transition"
                >
                  Upload Note
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-4 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white py-2 px-4 rounded-full font-medium shadow focus:ring-2 focus:ring-red-500 transition"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="ml-4 text-[var(--primary-color)] dark:text-[var(--primary-dark)] font-medium hover:underline focus:underline transition"
              >
                Login
              </Link>
            )}

            {/* Dark mode toggle button */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle Dark Mode"
              className="ml-6 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              type="button"
            >
              {isDarkMode ? (
                // Sun icon (Heroicons)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v1.5m0 15V21m9-9h-1.5M4.5 12H3m15.364 6.364l-1.06-1.06M6.696 6.696l-1.06-1.06m0 12.728l1.06-1.06m12.728-12.728l-1.06 1.06M12 7.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5z"
                  />
                </svg>
              ) : (
                // Moon icon (Heroicons)
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                >
                  <path d="M21.752 15.002A9.718 9.718 0 0 1 12 21.75a9.75 9.75 0 0 1-9.75-9.75 9.717 9.717 0 0 1 6.748-9.252 0.75 0.75 0 0 1 .976.977A7.5 7.5 0 1 0 20.774 14.026a0.75 0.75 0 0 1 .978.976z" />
                </svg>
              )}
            </button>
          </nav>
        </header>

        <main className="transition-colors duration-300 min-h-[calc(100vh-96px)]">{children}</main>

        <footer className="py-6 text-center text-sm text-gray-400 select-none">
          Made for students..
        </footer>
      </body>
    </html>
  );
}
