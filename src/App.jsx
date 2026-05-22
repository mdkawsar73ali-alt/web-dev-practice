// src/App.jsx
import React, { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, db } from './firebase'
import { doc, setDoc } from 'firebase/firestore' // ✅ যোগ করুন
import Navbar from './components/Navbar'
import Home from './pages/Home'
import FriendsPage from './pages/FriendsPage'
import Messenger from './pages/Messenger'
import Login from './pages/Login'

export default function App() {
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('home')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // ✅ প্রতিবার লগইনে Firestore এ user সেভ/আপডেট হবে
        await setDoc(doc(db, 'users', u.uid), {
          uid: u.uid,
          displayName: u.displayName || '',
          photoURL: u.photoURL || ''
        }, { merge: true })
      }
      setUser(u)
    })
    return () => unsub()
  }, [])

  if (!user) return <Login />

  return (
    <div className="app">
      <div className="topbar">
        <Navbar active={tab} setActive={setTab} user={user} onSignOut={() => signOut(auth)} />
      </div>
      <div className="container">
        <div className="main">
          {tab === 'home' && <Home />}
          {tab === 'friends' && <FriendsPage user={user} />}
          {tab === 'messages' && <Messenger user={user} />}
        </div>
        <div className="right">
          <div className="section">
            <div className="small">Logged in as</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 8 }}>
              <img src={auth.currentUser?.photoURL} alt="me" style={{ width: 44, height: 44, borderRadius: 999 }} />
              <div><strong>{auth.currentUser?.displayName}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}