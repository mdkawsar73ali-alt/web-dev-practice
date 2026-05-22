// src/pages/Login.jsx
import React from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider, db } from '../firebase'
import { doc, setDoc } from 'firebase/firestore' // ✅

export default function Login() {
  const handleGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, provider)
      const u = res.user
      // ✅ Firestore এ user সেভ
      await setDoc(doc(db, 'users', u.uid), {
        uid: u.uid,
        displayName: u.displayName || '',
        photoURL: u.photoURL || ''
      }, { merge: true }) // merge:true মানে আগের ডেটা মুছবে না
    } catch (e) {
      alert('Login failed: ' + e.message)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Sign in with Google</h2>
      <button onClick={handleGoogle}>Sign in with Google</button>
    </div>
  )
}