export type Mode = "game" | "freewrite";

export interface SubmitData {
  sentence: string;
  mode: Mode;
  isPublic: boolean;
}
