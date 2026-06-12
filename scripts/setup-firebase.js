/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║   SCRIPT DE INICIALIZACIÓN — PRODE MUNDIAL                      ║
 * ║   Crea el usuario administrador y puebla los datos en Firebase   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * USO:
 *   node scripts/setup-firebase.js
 *
 * REQUISITOS:
 *   npm install firebase (ya instalado)
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  writeBatch
} from 'firebase/firestore';

// ─── Configuración ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyClDWGGx43jCKj_T0pDq9RrvHnv94_D_as",
  authDomain: "mundial-139eb.firebaseapp.com",
  projectId: "mundial-139eb",
  storageBucket: "mundial-139eb.firebasestorage.app",
  messagingSenderId: "70061329775",
  appId: "1:70061329775:web:b24eee7ac623fe6b452c9a",
  measurementId: "G-SRWFNMVNCV"
};

const ADMIN_EMAIL    = 'admin@mundial.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_USERNAME = 'admin';
const ADMIN_NAME     = 'Administrador';

// ─── Datos iniciales de partidos ──────────────────────────────────────────────
const INITIAL_MATCHES = [
  // GRUPO A
  { id: 'A_1', group: 'A', teamA: 'MEXICO',        teamB: 'SUDAFRICA',    scoreA: null, scoreB: null, status: 'cancelled', order: 1 },
  { id: 'A_2', group: 'A', teamA: 'COREA DEL SUR', teamB: 'REP. CHECA',   scoreA: null, scoreB: null, status: 'cancelled', order: 2 },
  { id: 'A_3', group: 'A', teamA: 'REP. CHECA',    teamB: 'SUDAFRICA',    scoreA: null, scoreB: null, status: 'pending',   order: 3 },
  { id: 'A_4', group: 'A', teamA: 'MEXICO',        teamB: 'COREA DEL SUR',scoreA: null, scoreB: null, status: 'pending',   order: 4 },
  { id: 'A_5', group: 'A', teamA: 'SUDAFRICA',     teamB: 'COREA DEL SUR',scoreA: null, scoreB: null, status: 'pending',   order: 5 },
  { id: 'A_6', group: 'A', teamA: 'REP. CHECA',    teamB: 'MEXICO',       scoreA: null, scoreB: null, status: 'pending',   order: 6 },
  // GRUPO B
  { id: 'B_1', group: 'B', teamA: 'CANADA',  teamB: 'BOSNIA', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'B_2', group: 'B', teamA: 'CATAR',   teamB: 'SUIZA',  scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'B_3', group: 'B', teamA: 'SUIZA',   teamB: 'BOSNIA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'B_4', group: 'B', teamA: 'CANADA',  teamB: 'CATAR',  scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'B_5', group: 'B', teamA: 'SUIZA',   teamB: 'CANADA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'B_6', group: 'B', teamA: 'BOSNIA',  teamB: 'CATAR',  scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO C
  { id: 'C_1', group: 'C', teamA: 'BRASIL',  teamB: 'MARRUECOS', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'C_2', group: 'C', teamA: 'HAITI',   teamB: 'ESCOCIA',   scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'C_3', group: 'C', teamA: 'ESCOCIA', teamB: 'MARRUECOS', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'C_4', group: 'C', teamA: 'BRASIL',  teamB: 'HAITI',     scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'C_5', group: 'C', teamA: 'MARRUECOS',teamB: 'HAITI',    scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'C_6', group: 'C', teamA: 'ESCOCIA', teamB: 'BRASIL',    scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO D
  { id: 'D_1', group: 'D', teamA: 'EEUU',      teamB: 'PARAGUAY',  scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'D_2', group: 'D', teamA: 'AUSTRALIA', teamB: 'TURQUIA',   scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'D_3', group: 'D', teamA: 'EEUU',      teamB: 'AUSTRALIA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'D_4', group: 'D', teamA: 'TURQUIA',   teamB: 'PARAGUAY',  scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'D_5', group: 'D', teamA: 'TURQUIA',   teamB: 'EEUU',      scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'D_6', group: 'D', teamA: 'PARAGUAY',  teamB: 'AUSTRALIA', scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO E
  { id: 'E_1', group: 'E', teamA: 'ALEMANIA',         teamB: 'CURAZAO',          scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'E_2', group: 'E', teamA: 'COSTA DE MARFIL',  teamB: 'ECUADOR',          scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'E_3', group: 'E', teamA: 'ALEMANIA',         teamB: 'COSTA DE MARFIL',  scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'E_4', group: 'E', teamA: 'ECUADOR',          teamB: 'CURAZAO',          scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'E_5', group: 'E', teamA: 'CURAZAO',          teamB: 'COSTA DE MARFIL',  scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'E_6', group: 'E', teamA: 'ECUADOR',          teamB: 'ALEMANIA',         scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO F
  { id: 'F_1', group: 'F', teamA: 'PAISES BAJOS', teamB: 'JAPON',  scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'F_2', group: 'F', teamA: 'SUECIA',       teamB: 'TUNEZ',  scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'F_3', group: 'F', teamA: 'PAISES BAJOS', teamB: 'SUECIA', scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'F_4', group: 'F', teamA: 'TUNEZ',        teamB: 'JAPON',  scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'F_5', group: 'F', teamA: 'TUNEZ',        teamB: 'PAISES BAJOS', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'F_6', group: 'F', teamA: 'JAPON',        teamB: 'SUECIA', scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO G
  { id: 'G_1', group: 'G', teamA: 'BELGICA',      teamB: 'EGIPTO',        scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'G_2', group: 'G', teamA: 'IRAN',         teamB: 'NUEVA ZELANDA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'G_3', group: 'G', teamA: 'BELGICA',      teamB: 'IRAN',          scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'G_4', group: 'G', teamA: 'NUEVA ZELANDA',teamB: 'EGIPTO',        scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'G_5', group: 'G', teamA: 'NUEVA ZELANDA',teamB: 'BELGICA',       scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'G_6', group: 'G', teamA: 'EGIPTO',       teamB: 'IRAN',          scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO H
  { id: 'H_1', group: 'H', teamA: 'ESPAÑA',        teamB: 'CABO VERDE',    scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'H_2', group: 'H', teamA: 'ARABIA SAUDITA',teamB: 'URUGUAY',       scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'H_3', group: 'H', teamA: 'ESPAÑA',        teamB: 'ARABIA SAUDITA',scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'H_4', group: 'H', teamA: 'URUGUAY',       teamB: 'CABO VERDE',    scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'H_5', group: 'H', teamA: 'CABO VERDE',    teamB: 'ARABIA SAUDITA',scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'H_6', group: 'H', teamA: 'URUGUAY',       teamB: 'ESPAÑA',        scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO I
  { id: 'I_1', group: 'I', teamA: 'FRANCIA', teamB: 'SENEGAL', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'I_2', group: 'I', teamA: 'IRAK',    teamB: 'NORUEGA', scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'I_3', group: 'I', teamA: 'FRANCIA', teamB: 'IRAK',    scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'I_4', group: 'I', teamA: 'NORUEGA', teamB: 'SENEGAL', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'I_5', group: 'I', teamA: 'NORUEGA', teamB: 'FRANCIA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'I_6', group: 'I', teamA: 'SENEGAL', teamB: 'IRAK',    scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO J
  { id: 'J_1', group: 'J', teamA: 'AUSTRIA',   teamB: 'JORDANIA', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'J_2', group: 'J', teamA: 'ARGENTINA', teamB: 'ARGELIA',  scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'J_3', group: 'J', teamA: 'ARGENTINA', teamB: 'AUSTRIA',  scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'J_4', group: 'J', teamA: 'JORDANIA',  teamB: 'ARGELIA',  scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'J_5', group: 'J', teamA: 'ARGELIA',   teamB: 'AUSTRIA',  scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'J_6', group: 'J', teamA: 'JORDANIA',  teamB: 'ARGENTINA',scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO K
  { id: 'K_1', group: 'K', teamA: 'PORTUGAL',     teamB: 'REP. DEL CONGO', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'K_2', group: 'K', teamA: 'UZBEKISTAN',   teamB: 'COLOMBIA',       scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'K_3', group: 'K', teamA: 'PORTUGAL',     teamB: 'UZBEKISTAN',     scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'K_4', group: 'K', teamA: 'COLOMBIA',     teamB: 'REP. DEL CONGO', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'K_5', group: 'K', teamA: 'COLOMBIA',     teamB: 'PORTUGAL',       scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'K_6', group: 'K', teamA: 'REP. DEL CONGO',teamB: 'UZBEKISTAN',    scoreA: null, scoreB: null, status: 'pending', order: 6 },
  // GRUPO L
  { id: 'L_1', group: 'L', teamA: 'INGLATERRA', teamB: 'CROACIA', scoreA: null, scoreB: null, status: 'pending', order: 1 },
  { id: 'L_2', group: 'L', teamA: 'GHANA',      teamB: 'PANAMA',  scoreA: null, scoreB: null, status: 'pending', order: 2 },
  { id: 'L_3', group: 'L', teamA: 'INGLATERRA', teamB: 'GHANA',   scoreA: null, scoreB: null, status: 'pending', order: 3 },
  { id: 'L_4', group: 'L', teamA: 'PANAMA',     teamB: 'CROACIA', scoreA: null, scoreB: null, status: 'pending', order: 4 },
  { id: 'L_5', group: 'L', teamA: 'PANAMA',     teamB: 'INGLATERRA', scoreA: null, scoreB: null, status: 'pending', order: 5 },
  { id: 'L_6', group: 'L', teamA: 'CROACIA',    teamB: 'GHANA',   scoreA: null, scoreB: null, status: 'pending', order: 6 },
];

// ─── Inicializar Firebase ─────────────────────────────────────────────────────
console.log('\n🔥 Inicializando Firebase...');
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

async function setup() {
  // ── 1. Crear usuario administrador en Firebase Auth ─────────────────────────
  console.log('\n👤 Creando usuario administrador...');
  let adminUid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    adminUid = cred.user.uid;
    console.log(`   ✅ Usuario creado: ${ADMIN_EMAIL} (UID: ${adminUid})`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`   ℹ️  El usuario ${ADMIN_EMAIL} ya existe. Iniciando sesión...`);
      const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      adminUid = cred.user.uid;
      console.log(`   ✅ Sesión iniciada (UID: ${adminUid})`);
    } else {
      throw err;
    }
  }

  // ── 2. Crear perfil del administrador en Firestore ──────────────────────────
  console.log('\n📄 Guardando perfil de administrador en Firestore...');
  await setDoc(doc(db, 'users', adminUid), {
    uid:       adminUid,
    username:  ADMIN_USERNAME,
    name:      ADMIN_NAME,
    email:     ADMIN_EMAIL,
    role:      'admin',
    createdAt: new Date().toISOString()
  });
  console.log('   ✅ Perfil guardado.');

  // ── 3. Verificar si ya hay partidos ────────────────────────────────────────
  console.log('\n⚽ Verificando colección de partidos...');
  const matchesSnap = await getDocs(collection(db, 'matches'));

  if (!matchesSnap.empty) {
    console.log(`   ℹ️  Ya existen ${matchesSnap.size} partidos. No se re-inicializan.`);
  } else {
    console.log('   📥 Cargando los 72 partidos del Mundial...');
    // Dividir en batches de 500 (límite de Firestore)
    const chunks = [];
    for (let i = 0; i < INITIAL_MATCHES.length; i += 400) {
      chunks.push(INITIAL_MATCHES.slice(i, i + 400));
    }
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const match of chunk) {
        batch.set(doc(db, 'matches', match.id), match);
      }
      await batch.commit();
    }
    console.log(`   ✅ ${INITIAL_MATCHES.length} partidos cargados.`);
  }

  console.log('\n✨ ¡Setup completo! Tu base de datos está lista.\n');
  console.log('   Podés iniciar sesión con:');
  console.log(`   Usuario:    ${ADMIN_USERNAME}`);
  console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
  console.log('');
  process.exit(0);
}

setup().catch(err => {
  console.error('\n❌ Error durante el setup:', err.message);
  if (err.code === 'auth/configuration-not-found') {
    console.error('\n⚠️  IMPORTANTE: Debés habilitar el proveedor Email/Contraseña en la consola de Firebase:');
    console.error('   1. Ir a https://console.firebase.google.com');
    console.error('   2. Seleccionar el proyecto mundial-139eb');
    console.error('   3. Build → Authentication → Sign-in method');
    console.error('   4. Activar "Correo electrónico/contraseña"\n');
  }
  process.exit(1);
});
