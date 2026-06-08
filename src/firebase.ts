// PLACEHOLDER — not wired up yet.
//
// Planned: live match scores will be pulled from a football data API into
// Firestore, and the app will read them from here (mirrors the golf-pool app's
// score-ingestion pattern). Nothing imports this file yet, so the skeleton
// builds clean.
//
// To activate later:
//   1. Create a Firebase project (e.g. "worldcup-2026").
//   2. Add a Web App, paste its config into `firebaseConfig` below.
//   3. Uncomment the initialization and import `db` where needed.
//
// Firebase web config is public by design — security lives in Firestore rules.

// import { initializeApp } from 'firebase/app'
// import { getFirestore } from 'firebase/firestore'

// const firebaseConfig = {
//   apiKey: '...',
//   authDomain: '...',
//   projectId: '...',
//   storageBucket: '...',
//   messagingSenderId: '...',
//   appId: '...',
// }

// const app = initializeApp(firebaseConfig)
// export const db = getFirestore(app)

export {}
