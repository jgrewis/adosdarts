/* Chargement des démos (menu « Exemples »). Chemin relatif (R3), validation
   stricte comme tout Recording externe (CDC §5.2). */
import { validateRecording } from "./serialize.js";

export async function loadDemos() {
  try {
    const res = await fetch("assets/data/melodie-demos.json");
    if (!res.ok) return [];
    const list = await res.json();
    return list.map(validateRecording).filter(Boolean);
  } catch {
    return [];
  }
}
