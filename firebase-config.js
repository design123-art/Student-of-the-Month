/*
  ============================================================
  FIREBASE CONFIG — apni Firebase project ki details yahan daalein
  ============================================================
  1. https://console.firebase.google.com par jayein
  2. Naya project banayein (ya existing use karein)
  3. Project Settings -> General -> "Your apps" -> Web app (</>) add karein
  4. Wahan se milne wala config object neeche paste karein
  5. Firestore Database bhi enable karein: Build -> Firestore Database -> Create database
     (Start in TEST MODE for quick setup, then tighten security rules later)
  ============================================================
*/

const firebaseConfig = {
    apiKey: "AIzaSyCEgFDSw_ueM9W5ANlDErwoY4Z1YGBGovc",
    authDomain: "student-of-the-month-1f272.firebaseapp.com",
    projectId: "student-of-the-month-1f272",
    storageBucket: "student-of-the-month-1f272.firebasestorage.app",
    messagingSenderId: "574295010721",
    appId: "1:574295010721:web:169d76aee1b38d8810efe0"
};

// Initialize Firebase (compat SDK, loaded in index.html)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
