import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ============================================================================
// CONFIGURAÇÃO DE MÚLTIPLOS PROJETOS FIREBASE
// ============================================================================
// Este projeto (Mind Place Music) funciona como um "guarda-chuva" que agrega
// dados de múltiplos projetos Firebase "filhos" (MOADB, State of Mind, etc).
//
// ESTRUTURA:
// - db (padrão): Mind Place Music - dados gerais do site guarda-chuva
// - moadbDb: site-mindofadeadbody - discografia e dados do projeto MOADB
// - [futuro] somDb: State of Mind - discografia e dados do projeto SOM
// - [futuro] outrosDb: Outros projetos filhos conforme necessário
//
// COMO ADICIONAR UM NOVO PROJETO FILHO:
// 1. Adicione as variáveis de ambiente no .env com prefixo do projeto
// 2. Crie uma nova configuração abaixo (ex: somConfig)
// 3. Inicialize uma nova instância do Firebase com initializeApp()
// 4. Exporte o db correspondente (ex: export const somDb = getFirestore(somApp))
// 5. Crie um novo hook em src/hooks/ que use o db específico
// 6. Importe e use o hook no componente correspondente
// ============================================================================

// Projeto Principal: Mind Place Music
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Projeto Filho 1: Mind of a Dead Body (MOADB)
// Responsável por: discografia, releases do Spotify
const moadbConfig = {
  apiKey: import.meta.env.VITE_MOADB_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_MOADB_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_MOADB_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_MOADB_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MOADB_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_MOADB_FIREBASE_APP_ID,
};

// Inicializar instâncias do Firebase
const app = initializeApp(firebaseConfig);
const moadbApp = initializeApp(moadbConfig, 'moadb'); // 'moadb' é o identificador único

// Exportar instâncias do Firestore
export const db = getFirestore(app); // Mind Place Music
export const moadbDb = getFirestore(moadbApp); // Mind of a Dead Body
