import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  getDoc,
  serverTimestamp, // Date.now() এর বদলে এটি ব্যবহার করা ভালো
} from "firebase/firestore";

export default function Messenger() {
  const [currentUser, setCurrentUser] = useState(null);
  const [friendList, setFriendList] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  const scrollRef = useRef(); // অটো স্ক্রল করার জন্য

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  // Friend list লোড
  useEffect(() => {
    if (!currentUser) return;
    const fRef = collection(db, "friends", currentUser.uid, "list");
    const unsub = onSnapshot(fRef, async (snap) => {
      const friendUids = snap.docs.map((d) => d.id);
      const promises = friendUids.map((fid) => getDoc(doc(db, "users", fid)));
      const snaps = await Promise.all(promises);
      const list = snaps
        .filter((s) => s.exists())
        .map((s) => ({ uid: s.id, ...s.data() }));
      setFriendList(list);
      setFilteredFriends(list);
    });
    return () => unsub();
  }, [currentUser]);

  // Search filter
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredFriends(
      friendList.filter((f) =>
        (f.displayName || "").toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, friendList]);

  // Messages লোড ও অটো-স্ক্রল
  useEffect(() => {
    if (!currentUser || !selectedFriend) {
      setMessages([]);
      return;
    }
    const chatId =
      currentUser.uid < selectedFriend.uid
        ? `${currentUser.uid}_${selectedFriend.uid}`
        : `${selectedFriend.uid}_${currentUser.uid}`;

    const msgRef = query(
      collection(db, "messages", chatId, "chats"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(msgRef, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser, selectedFriend]);

  // নতুন মেসেজ আসলে নিচে স্ক্রল করা
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!currentUser || !selectedFriend || !newMessage.trim()) return;

    const chatId =
      currentUser.uid < selectedFriend.uid
        ? `${currentUser.uid}_${selectedFriend.uid}`
        : `${selectedFriend.uid}_${currentUser.uid}`;

    await addDoc(collection(db, "messages", chatId, "chats"), {
      from: currentUser.uid,
      text: newMessage,
      timestamp: serverTimestamp(), // সার্ভার টাইম ব্যবহার করা নিরাপদ
    });

    setNewMessage("");
  };

  return (
    <div style={{ display: "flex", height: "92vh", background: "#f5f7fb", fontFamily: "Arial" }}>
      
      {/* বাম পাশের লিস্ট - মোবাইলে হাইড হবে যদি কেউ সিলেক্ট করা থাকে */}
      <div style={{ 
        width: selectedFriend ? "0%" : "100%", 
        display: selectedFriend ? "none" : "block", // মোবাইলে লিস্ট দেখাবে
        flex: selectedFriend ? "none" : "1",
        backgroundColor: "#fff", borderRight: "1px solid #ddd", padding: 16, overflowY: "auto",
        transition: "0.3s"
      }}>
        <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1, paddingBottom: 10 }}>
            <h2 style={{ fontSize: 22, marginBottom: 15 }}>Messages</h2>
            <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "93%", padding: "12px", borderRadius: "10px", border: "1px solid #eee", background: "#f9f9f9" }}
            />
        </div>
        
        {filteredFriends.map((f) => (
          <div
            key={f.uid}
            onClick={() => setSelectedFriend(f)}
            style={{ padding: "12px 10px", borderRadius: 12, cursor: "pointer", backgroundColor: selectedFriend?.uid === f.uid ? "#eef6ff" : "transparent", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}
          >
            <img src={f.photoURL || "https://via.placeholder.com/50"} alt="" style={{ width: 45, height: 45, borderRadius: "50%", objectFit: "cover" }} />
            <div style={{ fontWeight: 600 }}>{f.displayName || "User"}</div>
          </div>
        ))}
      </div>

      {/* ডান পাশের চ্যাট উইন্ডো - মোবাইলে ফুল স্ক্রিন হবে যদি ফ্রেন্ড সিলেক্ট করা থাকে */}
      {selectedFriend && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", background: "#fff" }}>
          {/* চ্যাট হেডার */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSelectedFriend(null)} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer" }}>←</button>
            <img src={selectedFriend.photoURL || "https://via.placeholder.com/40"} alt="" style={{ width: 35, height: 35, borderRadius: "50%" }} />
            <span style={{ fontWeight: "bold" }}>{selectedFriend.displayName}</span>
          </div>

          {/* মেসেজ লিস্ট */}
          <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ alignSelf: m.from === currentUser.uid ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                <div style={{ 
                  background: m.from === currentUser.uid ? "#0084ff" : "#f0f0f0", 
                  color: m.from === currentUser.uid ? "#fff" : "#000", 
                  padding: "10px 14px", borderRadius: 18, fontSize: 14 
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={scrollRef} /> {/* অটো স্ক্রল টার্গেট */}
          </div>

          {/* ইনপুট এরিয়া */}
          <div style={{ padding: 16, borderTop: "1px solid #eee", display: "flex", gap: 10 }}>
            <input
              type="text"
              placeholder="Message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{ flex: 1, padding: "12px", borderRadius: "20px", border: "1px solid #eee", outline: "none", background: "#f9f9f9" }}
            />
            <button onClick={handleSend} style={{ background: "none", border: "none", color: "#0084ff", fontWeight: "bold", cursor: "pointer" }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}