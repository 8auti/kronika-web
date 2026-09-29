import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

export async function getCursos() {
  const q = query(collection(db, "cursos"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}