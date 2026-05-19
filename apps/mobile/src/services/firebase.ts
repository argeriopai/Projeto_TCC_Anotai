import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAWxjgS3U-2_CSUcBLwi9jbJmPX6OnW0Jo",
  authDomain: "anotai-145e1.firebaseapp.com",
  projectId: "anotai-145e1",
  storageBucket: "anotai-145e1.firebasestorage.app",
  messagingSenderId: "143171299379",
  appId: "1:143171299379:web:6c191fb0e6a4e536665b46"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
