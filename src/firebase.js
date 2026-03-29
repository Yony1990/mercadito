import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAeA9BmRZpw_mD2ioI3gNY5OWnEs3onGzM",
  authDomain: "mercadito-8ea37.firebaseapp.com",
  projectId: "mercadito-8ea37",
  storageBucket: "mercadito-8ea37.firebasestorage.app",
  messagingSenderId: "762934645765",
  appId: "1:762934645765:web:57eeadaee7eb0596daf86c"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
