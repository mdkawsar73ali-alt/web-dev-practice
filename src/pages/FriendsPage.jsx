// src/pages/FriendsPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";

export default function FriendsPage({ user }) {
  const uid = user?.uid;

  const [requests, setRequests] = useState({});
  const [requestsFromMe, setRequestsFromMe] = useState({});
  const [friends, setFriends] = useState({});
  const [friendDetails, setFriendDetails] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ✅ Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ১. ইনকামিং রিকোয়েস্ট
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, "friendRequests", uid, "incoming"),
      (snap) => {
        const data = {};
        snap.forEach((d) => (data[d.id] = d.data()));
        setRequests(data);
      }
    );
    return () => unsub();
  }, [uid]);

  // ২. আমি পাঠানো রিকোয়েস্ট
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, "friendRequests", uid, "sent"),
      (snap) => {
        const data = {};
        snap.forEach((d) => (data[d.id] = true));
        setRequestsFromMe(data);
      }
    );
    return () => unsub();
  }, [uid]);

  // ৩. বন্ধু লিস্ট
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, "friends", uid, "list"),
      async (snap) => {
        const friendsMap = {};
        snap.forEach((d) => (friendsMap[d.id] = d.data()));
        setFriends(friendsMap);

        const friendUids = Object.keys(friendsMap);
        if (friendUids.length > 0) {
          const snaps = await Promise.all(
            friendUids.map((fid) => getDoc(doc(db, "users", fid)))
          );
          setFriendDetails(
            snaps
              .filter((s) => s.exists())
              .map((s) => ({ uid: s.id, ...s.data() }))
          );
        } else {
          setFriendDetails([]);
        }
      }
    );
    return () => unsub();
  }, [uid]);

  // ৪. সব ইউজার
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ uid: d.id, ...d.data() }));
      setAllUsers(arr);
    });
    return () => unsub();
  }, []);

  // ফাংশন
  const sendRequest = async (toUid) => {
    if (!uid || uid === toUid) return;
    const now = Date.now();
    await setDoc(doc(db, "friendRequests", toUid, "incoming", uid), {
      from: uid,
      name: user.displayName || "",
      photoURL: user.photoURL || "",
      time: now,
    });
    await setDoc(doc(db, "friendRequests", uid, "sent", toUid), {
      to: toUid,
      time: now,
    });
  };

  const acceptRequest = async (fromUid) => {
    if (!uid) return;
    const now = Date.now();
    await setDoc(doc(db, "friends", uid, "list", fromUid), { since: now });
    await setDoc(doc(db, "friends", fromUid, "list", uid), { since: now });
    await deleteDoc(doc(db, "friendRequests", uid, "incoming", fromUid));
    await deleteDoc(doc(db, "friendRequests", fromUid, "sent", uid));
  };

  const rejectRequest = async (fromUid) => {
    if (!uid) return;
    await deleteDoc(doc(db, "friendRequests", uid, "incoming", fromUid));
    await deleteDoc(doc(db, "friendRequests", fromUid, "sent", uid));
  };

  const unfriend = async (friendUid) => {
    if (!uid) return;
    await deleteDoc(doc(db, "friends", uid, "list", friendUid));
    await deleteDoc(doc(db, "friends", friendUid, "list", uid));
  };

  // ফিল্টার
  const q = search.trim().toLowerCase();

  const incomingList = Object.keys(requests)
    .map((k) => ({ uid: k, ...requests[k] }))
    .filter((r) => (r.name || "").toLowerCase().includes(q));

  const addable = allUsers
    .filter((u) => u.uid !== uid)
    .filter((u) => !friends[u.uid])
    .filter((u) => !requestsFromMe[u.uid])
    .filter((u) => !requests[u.uid])
    .filter((u) => (u.displayName || "").toLowerCase().includes(q));

  const friendList = friendDetails.filter((f) =>
    (f.displayName || "").toLowerCase().includes(q)
  );

  // ✅ Responsive Styles
  const containerStyle = {
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: isMobile ? 12 : 20,
    padding: isMobile ? "10px" : "20px",
  };

  const leftStyle = {
    flex: 1,
    minWidth: 0,
  };

  const rightStyle = {
    width: isMobile ? "100%" : 320,
    minWidth: 0,
  };

  const btnBase = {
    border: "none",
    borderRadius: 8,
    padding: isMobile ? "7px 12px" : "8px 14px",
    fontSize: isMobile ? 14 : 16,
    cursor: "pointer",
  };

  const nameStyle = {
    fontWeight: 700,
    fontSize: isMobile ? 14 : 16,
    color: "#111827",
  };

  const cardRowStyle = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    borderBottom: "1px solid #eee",
    padding: "12px 0",
  };

  const avatarSize = isMobile ? 46 : 60;

  return (
    <div style={containerStyle}>
      {/* বাম দিক */}
      <div style={leftStyle}>
        {/* সার্চ */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search users or friends..."
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: isMobile ? 14 : 16,
            marginBottom: 16,
            boxSizing: "border-box",
          }}
        />

        {/* Friend Requests */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: "#ef4444", marginBottom: 10, fontSize: isMobile ? 16 : 18 }}>
            📩 Friend Requests
          </h3>
          {incomingList.length === 0 && (
            <div style={{ color: "#6b7280" }}>No new friend requests.</div>
          )}
          {incomingList.map((r) => (
            <div key={r.uid} style={cardRowStyle}>
              <img
                src={r.photoURL || `https://ui-avatars.com/api/?name=${r.name}&background=random`}
                alt={r.name}
                style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameStyle}>{r.name || r.uid}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => acceptRequest(r.uid)} style={{ ...btnBase, background: "#22c55e", color: "#fff" }}>
                    Accept
                  </button>
                  <button onClick={() => rejectRequest(r.uid)} style={{ ...btnBase, background: "#ef4444", color: "#fff" }}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Friends */}
        <div>
          <h3 style={{ color: "#10b981", marginBottom: 10, fontSize: isMobile ? 16 : 18 }}>
            🆕 Add New Friends
          </h3>
          {addable.length === 0 && (
            <div style={{ color: "#6b7280" }}>No users found.</div>
          )}
          {addable.map((u) => (
            <div key={u.uid} style={cardRowStyle}>
              <img
                src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}&background=random`}
                alt={u.displayName}
                style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={nameStyle}>{u.displayName || u.uid}</div>
                <button
                  onClick={() => sendRequest(u.uid)}
                  style={{ ...btnBase, background: "#3b82f6", color: "#fff", marginTop: 8 }}
                >
                  Add Friend
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ডান দিক — Friend List */}
      <div style={rightStyle}>
        <h3 style={{ color: "#3b82f6", marginBottom: 10, fontSize: isMobile ? 16 : 18 }}>
          👥 Friend List
        </h3>
        {friendList.length === 0 && (
          <div style={{ color: "#6b7280" }}>No friends yet.</div>
        )}
        {friendList.map((f) => (
          <div
            key={f.uid}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              borderBottom: "1px solid #eee",
              padding: "10px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img
                src={f.photoURL || `https://ui-avatars.com/api/?name=${f.displayName}&background=random`}
                alt={f.displayName}
                style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={nameStyle}>{f.displayName || f.uid}</div>
            </div>
            <button
              onClick={() => {
                if (window.confirm(`Unfriend ${f.displayName || f.uid}?`)) {
                  unfriend(f.uid);
                }
              }}
              style={{ ...btnBase, background: "#f3f4f6", padding: "6px 10px" }}
            >
              ···
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}