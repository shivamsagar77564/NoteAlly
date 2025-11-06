'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notesByDay, setNotesByDay] = useState(Array(7).fill(0)); // daily counts

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u);
      if (!u) router.push('/login');
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);

    // Get notes uploaded by user in last 7 days
    const today = dayjs().startOf('day');
    const sevenDaysAgo = today.subtract(6, 'day');
    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      // Firestore can't do server filtering by day, so we get all notes and filter client-side
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const notesList = [];
      snapshot.forEach(doc => {
        notesList.push({ id: doc.id, ...doc.data() });
      });
      setNotes(notesList);
      setLoading(false);

      // Group notes by day for the past 7 days
      const counts = Array(7).fill(0);
      notesList.forEach(note => {
        let dateObj;
        if (note.createdAt?.toDate) dateObj = note.createdAt.toDate();
        else if (note.createdAt?.seconds) dateObj = new Date(note.createdAt.seconds * 1000);
        else return;
        const noteDay = dayjs(dateObj).startOf('day');
        // Find which bucket
        for (let i = 0; i < 7; i++) {
          const bucketDay = sevenDaysAgo.add(i, 'day');
          if (noteDay.isSame(bucketDay, 'day')) {
            counts[i]++;
            break;
          }
        }
      });
      setNotesByDay(counts);
    });

    return unsubscribe;
  }, [user]);

  // Other stats (all time)
  const totalLikes = notes.reduce((sum, n) => sum + (n.likes || 0), 0);
  const totalViews = notes.reduce((sum, n) => sum + (n.views || 0), 0);

  const deleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
    } catch (error) {
      alert('Failed to delete note: ' + error.message);
    }
  };

  // Labels for the past 7 days
  const labels = Array(7)
    .fill(0)
    .map((_, i) =>
      dayjs().startOf('day')
        .subtract(6 - i, 'day')
        .format('ddd DD/MM')
    );

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Notes Uploaded',
        data: notesByDay,
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99,102,241,0.2)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: true, text: 'Your Note Uploads (Last 7 Days)' }
    },
    scales: {
      y: { beginAtZero: true, stepSize: 1 }
    }
  };

  // Skeleton loader (card) for loading state
  const skeletonNotes = Array(2).fill().map((_, idx) => (
    <div key={idx} className="flex flex-col animate-pulse sm:flex-row sm:items-center justify-between p-4 bg-indigo-100/30 dark:bg-gray-700 rounded-lg border border-indigo-100 dark:border-gray-600 shadow-sm transition-colors">
      <div className="mb-3 sm:mb-0 w-full">
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-1" />
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-600 rounded" />
        <div className="h-10 w-20 bg-gray-200 dark:bg-gray-600 rounded" />
      </div>
    </div>
  ));

  return (
    <section className="min-h-[85vh] p-6 bg-gradient-to-b from-blue-100 to-indigo-50 dark:from-gray-800 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow p-8 transition-colors">
        <h1 className="text-3xl font-bold mb-2 text-[var(--primary-color)] dark:text-[var(--primary-dark)]">
          {user ? (user.displayName || user.email) + "'s Dashboard" : 'User Dashboard'}
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Welcome! Here’s an overview of your uploads and engagement.
        </p>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 text-center">
          <div className="bg-blue-50 dark:bg-indigo-900 rounded-xl py-4 px-5 shadow transition-colors flex flex-col items-center">
            <span className="mb-1 text-2xl">📄</span>
            <p className="text-2xl font-semibold text-blue-700 dark:text-indigo-300">{notes.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Notes Uploaded</p>
          </div>
          <div className="bg-blue-50 dark:bg-indigo-900 rounded-xl py-4 px-5 shadow transition-colors flex flex-col items-center">
            <span className="mb-1 text-2xl">👍</span>
            <p className="text-2xl font-semibold text-blue-700 dark:text-indigo-300">{totalLikes}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Likes</p>
          </div>
          <div className="bg-blue-50 dark:bg-indigo-900 rounded-xl py-4 px-5 shadow transition-colors flex flex-col items-center">
            <span className="mb-1 text-2xl">👀</span>
            <p className="text-2xl font-semibold text-blue-700 dark:text-indigo-300">{totalViews}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
          </div>
        </div>

        {/* Real Chart Section */}
        <div className="mb-8">
          <Line data={chartData} options={chartOptions} />
        </div>

        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Your Notes</h2>

        {loading && (
          <div>{skeletonNotes}</div>
        )}

        {!loading && notes.length === 0 && (
          <div className="text-center py-10">
            <span className="text-3xl mb-2 block">😊</span>
            <p className="text-base text-gray-600 dark:text-gray-400 mb-3">
              You haven&apos;t uploaded any notes yet.
            </p>
            <a
              href="/upload"
              className="inline-block px-6 py-3 bg-[var(--primary-color)] hover:bg-[var(--primary-dark)] text-white rounded-full font-semibold shadow transition"
            >
              Upload your first note!
            </a>
          </div>
        )}

        <div className="space-y-4">
          {notes.map(note => (
            <div
              key={note.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-indigo-50 dark:bg-gray-700 rounded-lg border border-indigo-100 dark:border-gray-600 shadow-sm transition-colors"
            >
              <div className="mb-3 sm:mb-0 flex flex-col gap-1">
                <div className="mb-2 h-[40px] w-[32px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow flex items-center justify-center">
                  <span className="text-gray-400 dark:text-gray-500 text-lg">📄</span>
                </div>
                <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">{note.title}</h3>
                <p className="text-indigo-700 dark:text-indigo-400 font-medium">{note.subject}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Uploaded: {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleString() : 'unknown'}
                </p>
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>👍 {note.likes || 0}</span>
                  <span>👀 {note.views || 0}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href={note.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-dark)] rounded text-white font-semibold transition"
                  title="Download"
                  aria-label="Download Note PDF"
                >
                  Download
                </a>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-white font-semibold transition"
                  title="Delete"
                  aria-label="Delete Note"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
