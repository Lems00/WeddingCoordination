/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" pour brancher le store sur l'API D1 ; sinon mode localStorage (démo). */
  readonly VITE_USE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
