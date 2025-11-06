'use client';

import { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u);
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <p className="min-h-[85vh] flex justify-center items-center text-gray-500 dark:text-gray-300">
        Checking session...
      </p>
    );
  }

  return (
    <section className="min-h-[85vh] flex items-center justify-center bg-var-bg-color dark:bg-gray-900 px-2 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md w-full px-8 py-10 transition-colors duration-300">
        <h2 className="text-3xl font-bold text-[var(--primary-color)] dark:text-[var(--primary-dark)] mb-2 text-center">
          {isRegistering ? 'Sign Up' : 'Welcome Back'}
        </h2>
        <p className="mb-6 text-gray-500 dark:text-gray-400 text-center">
          {isRegistering ? 'Join NoteAlly and start contributing!' : 'Login to discover or share notes.'}
        </p>
        {user ? (
          <div className="w-full flex flex-col items-center">
            <p className="mb-6 text-gray-800 dark:text-gray-200 text-lg font-medium">Hi, {user.email}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-4 mb-3 rounded-lg bg-[var(--primary-color)] dark:bg-[var(--primary-dark)] text-white font-semibold transition hover:opacity-90 focus:ring-2 focus:ring-[var(--primary-color)]"
            >
              Go to Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-3 px-4 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 text-white font-semibold transition focus:ring-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
              required
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:border-[var(--accent)] transition"
              required
            />
            {error && <span className="text-red-600 dark:text-red-400 text-sm mb-2">{error}</span>}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[var(--primary-color)] dark:bg-[var(--primary-dark)] hover:opacity-90 text-white font-semibold transition focus:ring-2 focus:ring-[var(--primary-color)]"
            >
              {isRegistering ? 'Sign Up' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 font-semibold transition flex items-center justify-center gap-2"
            >
              <span>Sign in with Google</span>
            </button>
            <p className="text-sm text-center mt-4 text-gray-700 dark:text-gray-300">
              {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[var(--accent)] underline ml-2"
              >
                {isRegistering ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
