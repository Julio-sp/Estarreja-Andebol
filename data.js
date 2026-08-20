/**
 * ============================================================================
 * CAMADA DE DADOS (Firestore)
 * ============================================================================
 * Todas as leituras usam onSnapshot (tempo real): qualquer alteração feita
 * por outra pessoa da equipa técnica aparece automaticamente aqui, sem
 * precisar de recarregar a página.
 *
 * A marcação de presença usa updateDoc com um caminho de campo específico
 * (ex.: "presencas.ATLETA_ID"), em vez de reescrever o documento inteiro.
 * Isto significa que, se duas pessoas marcarem presenças diferentes na
 * mesma sessão ao mesmo tempo, as duas alterações ficam gravadas — não há
 * risco de uma apagar o trabalho da outra.
 * ============================================================================
 */
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const atletasCol = collection(db, "atletas");
const sessoesCol = collection(db, "sessoes");
const avisosCol = collection(db, "avisos");

function snapshotToArray(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------------------- ATLETAS ---------------------------- */
export function listenAtletas(onChange, onError) {
  return onSnapshot(atletasCol, (snap) => onChange(snapshotToArray(snap)), onError);
}
export function addAtleta({ nome, escalao, posicao }) {
  return addDoc(atletasCol, { nome, escalao, posicao: posicao || "", ativo: true, createdAt: serverTimestamp() });
}
export function updateAtleta(id, patch) {
  return updateDoc(doc(db, "atletas", id), patch);
}
export function deleteAtleta(id) {
  return deleteDoc(doc(db, "atletas", id));
}

/* ---------------------------- SESSÕES ---------------------------- */
export function listenSessoes(onChange, onError) {
  return onSnapshot(sessoesCol, (snap) => onChange(snapshotToArray(snap)), onError);
}
export function addSessao({ data, hora, tipo, escalao }) {
  return addDoc(sessoesCol, {
    data,
    hora: hora || "",
    tipo,
    escalao,
    estado: "agendada",
    notas: "",
    presencas: {},
    createdAt: serverTimestamp(),
  });
}
export function updateSessao(id, patch) {
  return updateDoc(doc(db, "sessoes", id), patch);
}
export function updateSessaoPresenca(sessionId, atletaId, estado) {
  // Atualização atómica de um único campo dentro do mapa "presencas" —
  // não interfere com o que outra pessoa esteja a gravar ao mesmo tempo.
  return updateDoc(doc(db, "sessoes", sessionId), { [`presencas.${atletaId}`]: estado });
}
export function deleteSessao(id) {
  return deleteDoc(doc(db, "sessoes", id));
}

/* ---------------------------- AVISOS ---------------------------- */
export function listenAvisos(onChange, onError) {
  return onSnapshot(avisosCol, (snap) => onChange(snapshotToArray(snap)), onError);
}
export function addAviso({ autor, texto }) {
  return addDoc(avisosCol, { autor: autor || "Equipa técnica", texto, data: todayISOLocal(), createdAt: serverTimestamp() });
}
export function deleteAviso(id) {
  return deleteDoc(doc(db, "avisos", id));
}

function todayISOLocal() {
  return new Date().toISOString().slice(0, 10);
}
