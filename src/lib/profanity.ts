import { Filter } from "bad-words";

const filter = new Filter();
// Add Italian / French extras
filter.addWords(
  // IT
  "stronzo","stronza","cazzo","merda","puttana","troia","vaffanculo","fanculo","figa","coglione","bastardo",
  // FR
  "putain","merde","salope","connard","enculé","encule","pute","con","conne","batard"
);

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  try { return filter.isProfane(text); } catch { return false; }
}

export function cleanProfanity(text: string): string {
  if (!text) return text;
  try { return filter.clean(text); } catch { return text; }
}
