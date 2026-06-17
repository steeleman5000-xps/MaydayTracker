import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export function subscribeAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function signIn(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function createAccount(email: string, password: string) {
  await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
}

export async function signOutUser() {
  await signOut(auth);
}
