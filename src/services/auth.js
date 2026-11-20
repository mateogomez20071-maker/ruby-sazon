import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function registerUser(name, email, password) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = credential.user;

  await setDoc(doc(db, "users", user.uid), {
    name,
    email,
    role: "owner",
    createdAt: new Date()
  });

  return user;
}

export async function loginUser(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function getUserData(uid) {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data();
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}