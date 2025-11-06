# NoteAlly

NoteAlly is a modern Next.js application for students to upload, share, browse, and download high‑quality study notes.  
It includes AI‑powered PDF summarization using Google Gemini to instantly create summaries and key points from uploaded notes.

---

## ✨ Features

- **User Authentication**
  - Email + Password
  - Google Sign‑In (Powered by Firebase Auth)
- **Upload Notes**
  - Upload PDF files with metadata (Title, Subject)
  - Stored in Firebase Storage with Firestore metadata
- **Browse Shared Notes**
  - Filter by subject (“folder” style)
  - Search by title or subject
  - Like and view counts
  - Download PDF directly
- **AI‑Powered Summaries**
  - Backend uses pdf-parse to extract text from PDF
  - Sends text to Google Gemini API (gemini‑1.5‑flash or gemini‑1.5‑pro)
  - Generates:
    - A concise student‑friendly summary in bullet points
    - Key points / possible exam questions
  - Results are stored in Firestore and shown on the note’s card
- **User Dashboard**
  - Manage your uploaded notes
  - View stats: total notes, likes, and views
  - Delete your notes
- **Dark Mode 🌙**
  - Smooth toggle, preference persisted
- **Real‑time Updates 🔄**
  - Powered by Firestore snapshot listeners
- **Responsive UI**
  - Tailwind CSS for mobile‑first design

---

## 🛠 Tech Stack

- **Frontend:** Next.js 13+ (App Router)
- **Backend/Data:** Firebase Auth, Firestore, Storage
- **AI:** Google Gemini Generative AI API
- **PDF Processing:** pdf‑parse
- **Styling:** Tailwind CSS
- **Notifications:** React Hot Toast

---

## 📂 Project Structure

```
src/
├── app/
│   ├── layout.js                  # Root layout
│   ├── page.js                    # Home
│   ├── login/page.js              # Login & Signup
│   ├── dashboard/page.js          # Dashboard
│   ├── notes/page.js              # Browse & Summarize notes
│   ├── upload/page.js             # Note upload
│   └── api/
│       └── ai/process-pdf/route.js  # AI PDF summary endpoint
├── lib/
│   ├── aiUtils.js                 # Gemini API logic
│   └── pdfUtils.js                # PDF.js / pdf-parse utils
├── firebase.js                    # Firebase init/config
└── globals.css                    # Global styles
```

---

## 🚀 Demo

Visit the live demo:  
https://note-ally-6jq5.vercel.app/

---

## 📧 Contact

Created by **Shivam**  
📩 Email: shivamsagar77564@gmail.com
