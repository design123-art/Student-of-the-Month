# Student of the Month — Website

Ye website "Student of the Month" ka poora system hai: School Settings, Add Student form (photo, father name, class, section, month, teacher review, additional details), Firebase database, aur 3 tarah ke print options (single card / class-wise / all-on-one-A4).

Files:
- `index.html` — page structure
- `style.css` — design + print styles
- `app.js` — sara logic (form handling, Firestore, filters, print)
- `firebase-config.js` — **yahan apni Firebase keys daalni hain**

## Setup (5 minutes)

1. **Firebase project banayein**
   - https://console.firebase.google.com par jayein → "Add project" → naam dein (e.g. `xyz-school-som`).

2. **Web App add karein**
   - Project ke andar `</>` (Web) icon par click karein → app register karein.
   - Jo `firebaseConfig` object milega (apiKey, authDomain, projectId, etc.), use copy karke `firebase-config.js` file mein paste kar dein (jahan `YOUR_API_KEY` waghera likha hai).

3. **Firestore Database on karein**
   - Left menu mein Build → Firestore Database → "Create database" → **Start in test mode** (jaldi setup ke liye). Baad mein security rules tight kar sakte hain.

4. **Website open karein**
   - `index.html` ko kisi bhi browser mein double-click karke khol lein, ya kisi bhi static hosting (Firebase Hosting, Netlify, GitHub Pages) par upload kar dein.

5. **Pehla kaam:** "School Settings" tab mein ja kar School Logo, Name, Address save karein — ye har card/print par dikhega.

6. **Student add karna:** "Add Student" tab mein form bharein — photo upload, name, father name, class, section, month select, teacher review (checkboxes), additional comments → "Save to Database".

7. **Records & Print:** "Records & Print" tab mein sab students dikhenge. Month/Class filter laga sakte hain, aur teen print options:
   - **Single Card** — ek student ka card select karke print
   - **Class-wise Cards** — ek class select karke us class ke sab students ka print
   - **All on One A4** — jitne bhi filtered students hain, sab ek hi grid mein A4 page(s) par print

Print button dabane par browser ka print dialog khulega — wahan se "Save as PDF" choose kar ke PDF bhi bana sakte hain (yahi "Generate PDF" ka kaam karta hai).

## Notes
- Photos Firestore mein compressed base64 string ki tarah save hoti hain (koi alag Storage bill nahi lagta, free Spark plan par bhi chalega).
- Firestore security rules ke liye `firestore.rules` file dekhein — Firebase Console → Firestore Database → Rules tab mein paste karein.
