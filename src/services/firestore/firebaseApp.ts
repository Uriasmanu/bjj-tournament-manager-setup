import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, type Firestore } from 'firebase/firestore'

let app: FirebaseApp | null = null
let db: Firestore | null = null

function getFirebaseConfig() {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
}

export function getFirebaseApp(): FirebaseApp {
  if (app) return app
  app = getApps()[0] ?? initializeApp(getFirebaseConfig())
  return app
}

export function getDb(): Firestore {
  if (db) return db
  db = initializeFirestore(getFirebaseApp(), { localCache: persistentLocalCache() })
  return db
}
