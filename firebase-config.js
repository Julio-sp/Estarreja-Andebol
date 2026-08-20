/**
 * ============================================================================
 * CONFIGURAÇÃO DO FIREBASE
 * ============================================================================
 * Estas chaves não são secretas — o Firebase foi desenhado para que a
 * configuração do lado do cliente fique visível no código. A segurança real
 * dos dados está definida nas Regras do Firestore (ver README.md).
 * ============================================================================
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBDwyO2ncHfSwFoOZ3z-IGkxt-gmeGvxNQ",
  authDomain: "treinos-eac.firebaseapp.com",
  projectId: "treinos-eac",
  storageBucket: "treinos-eac.firebasestorage.app",
  messagingSenderId: "636962238686",
  appId: "1:636962238686:web:4a5376941bd3430d10124f",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
