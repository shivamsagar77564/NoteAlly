'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';

export default function NotesPage() {
  // ---------------------
  // State Management
  // ---------------------
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [aiLoadingId, setAiLoadingId] = useState(null);
  const [visibleSummaries, setVisibleSummaries] = useState({}); // Track per-note summary visibility

  // ---------------------
  // Data Fetch & Subscriptions
  // ---------------------
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(u => setUser(u));
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allNotes = [];
      querySnapshot.forEach((docSnap) => {
        allNotes.push({ id: docSnap.id, ...docSnap.data() });
      });
      setNotes(allNotes);
      setLoading(false);

      setSubjects([...new Set(allNotes.map(note => note.subject || 'Uncategorized'))]);
    });

    return () => {
      unsubscribe();
      unsubAuth();
    };
  }, []);

  // ---------------------
  // Filtering
  // ---------------------
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject ? note.subject === selectedSubject : true;
    return matchesSearch && matchesSubject;
  });

  // ---------------------
  // User Actions
  // ---------------------
  const handleLike = async (note) => {
    if (!user) return toast.error('Please log in to like notes!');
    const noteRef = doc(db, 'notes', note.id);
    const isLiked = note.likedBy?.includes(user.uid);

    try {
      await updateDoc(noteRef, {
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likes: (note.likes || 0) + (isLiked ? -1 : 1),
      });
      toast(isLiked ? 'Like removed' : 'Liked!');
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleView = async (note) => {
    try {
      await updateDoc(doc(db, 'notes', note.id), {
        views: (note.views || 0) + 1,
      });
    } catch {
      toast.error('Failed to update view count');
    }
  };

  const toggleSummaryVisibility = (noteId) => {
    setVisibleSummaries(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  // ---------------------
  // AI Summary Handler
  // ---------------------
  const handleAISummary = async (note) => {
    setAiLoadingId(note.id);
    toast('AI Summarization started. This may take up to a minute for large PDFs.');
    try {
      const aiRes = await fetch('/api/ai/process-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfUrl: note.fileURL }),
      });
      const result = await aiRes.json();

      if (aiRes.ok) {
        await updateDoc(doc(db, 'notes', note.id), {
          summary: result.summary,
          points: result.points,
        });
        toast.success('AI Summary generated and saved!');
      } else {
        toast.error(result.error || 'AI summary failed.');
      }
    } catch {
      toast.error('Failed to process with AI.');
    } finally {
      setAiLoadingId(null);
    }
  };

  // ---------------------
  // Render
  // ---------------------
  return (
    <section className="min-h-[85vh] bg-gradient-to-b from-indigo-100 to-indigo-50 dark:from-gray-800 dark:to-gray-900 p-4 transition-colors">
      <Toaster position="top-center" />

      {/* Title */}
      <h1 className="text-4xl font-bold text-indigo-900 dark:text-indigo-200 mb-8 text-center">
        Shared Notes
      </h1>

      {/* Filters & Search */}
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 mb-8">
        {/* Subject Filters */}
        <div className="flex flex-wrap gap-3">
          <button
            className={`px-5 py-2 rounded-full font-semibold transition ${
              selectedSubject === null
                ? 'bg-[var(--primary-color)] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
            onClick={() => setSelectedSubject(null)}
          >
            All Subjects
          </button>
          {subjects.map(subject => (
            <button
              key={subject}
              className={`px-5 py-2 rounded-full font-semibold transition ${
                selectedSubject === subject
                  ? 'bg-[var(--primary-color)] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
              onClick={() => setSelectedSubject(subject)}
            >
              {subject}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="flex justify-end w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-64 p-3 rounded border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 transition"
          />
        </div>
      </div>

      {/* Loading & Empty states */}
      {loading && (
        <p className="text-center text-indigo-700 dark:text-indigo-400">Loading notes...</p>
      )}
      {!loading && filteredNotes.length === 0 && (
        <p className="text-center text-indigo-700 dark:text-indigo-400">No notes found.</p>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {filteredNotes.map(note => {
          const isLiked = note.likedBy && user && note.likedBy.includes(user.uid);
          const showSummary = visibleSummaries[note.id] ?? true;
          return (
            <div
              key={note.id}
              className="border rounded-lg p-6 shadow bg-white dark:bg-gray-800 flex flex-col justify-between transition-colors"
            >
              <div>
                <h2 className="text-xl font-semibold text-indigo-800 dark:text-indigo-300 mb-2">
                  {note.title}
                </h2>
                <p className="text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                  Subject: {note.subject}
                </p>
                <p className="text-indigo-600 dark:text-indigo-400 text-sm mb-3">
                  Uploaded by: {note.uploaderEmail || note.userId}
                </p>

                {/* Toggle Summary Button */}
                {(note.summary || note.points) && (
                  <button
                    onClick={() => toggleSummaryVisibility(note.id)}
                    className="mb-2 rounded px-3 py-1 text-sm font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  >
                    {showSummary ? 'Hide AI Summary' : 'Show AI Summary'}
                  </button>
                )}

                {/* AI Summary */}
                {showSummary && note.summary && (
                  <div className="bg-blue-50 dark:bg-blue-900 px-3 py-2 rounded mb-2">
                    <h4 className="text-blue-900 dark:text-blue-100 text-sm font-semibold mb-1">
                      AI Summary
                    </h4>
                    <ul className="list-disc ml-5 text-blue-900 dark:text-blue-200 text-sm">
                      {note.summary.split('\n').map((line, i) =>
                        line.trim() ? <li key={i}>{line.trim()}</li> : null
                      )}
                    </ul>
                  </div>
                )}

                {/* AI Key Points / Questions */}
                {showSummary && note.points && (
                  <div className="bg-green-50 dark:bg-green-900 px-3 py-2 rounded mb-2">
                    <h4 className="text-green-900 dark:text-green-100 text-sm font-semibold mb-1">
                      AI Key Points / Questions
                    </h4>
                    <ul className="list-disc ml-5 text-green-900 dark:text-green-200 text-sm">
                      {note.points.split('\n').map((point, i) =>
                        point.trim() ? <li key={i}>{point.trim()}</li> : null
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <a
                  href={note.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleView(note)}
                  className="text-indigo-700 dark:text-indigo-300 font-semibold hover:underline"
                >
                  Download PDF
                </a>
                <div className="flex items-center gap-3">
                  {/* AI Summary Button */}
                  {(!note.summary || !note.points) && (
                    <button
                      onClick={() => handleAISummary(note)}
                      className="rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1 transition bg-indigo-200 dark:bg-indigo-700 text-indigo-900 dark:text-indigo-100 hover:bg-indigo-300 dark:hover:bg-indigo-600"
                      disabled={aiLoadingId === note.id}
                      aria-label="Get AI summary"
                    >
                      {aiLoadingId === note.id ? 'Processing...' : 'Generate AI Summary'}
                    </button>
                  )}
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(note)}
                    className={`rounded-full px-3 py-1 text-sm font-semibold flex items-center gap-1 transition ${
                      isLiked
                        ? 'bg-[var(--primary-color)] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-600'
                    }`}
                    disabled={!user}
                    aria-label={isLiked ? 'Unlike note' : 'Like note'}
                  >
                    <span>👍</span> {note.likes || 0}
                  </button>
                  <span className="text-indigo-500 dark:text-indigo-400 text-sm">
                    Views: {note.views || 0}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
