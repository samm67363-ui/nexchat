import React, { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "../services/firebase";
import api from "../services/api";
import { initSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const register = async (email, password, username) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: username });
  const token = await cred.user.getIdToken();
  const res = await api.post("/users/register", {
    firebaseUid: cred.user.uid,
    username,
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  setDbUser(res.data);
  return cred.user;
};

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    disconnectSocket();
    await signOut(auth);
    setDbUser(null);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const res = await api.get("/users/me");
          setDbUser(res.data);
          await initSocket(() => user.getIdToken());
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, dbUser, setDbUser, register, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);