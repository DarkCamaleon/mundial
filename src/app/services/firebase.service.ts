import { Injectable, signal } from '@angular/core';
import { Match, Prediction, UserProfile, LeaderboardEntry, GroupStanding } from '../models/models';
import { INITIAL_MATCHES, OFFICIAL_SCORES_FROM_IMAGE } from '../data/initial-matches';

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updatePassword, signOut, deleteUser, User as FirebaseUser, Auth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc, deleteDoc, writeBatch, onSnapshot, Firestore } from 'firebase/firestore';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyClDWGGx43jCKj_T0pDq9RrvHnv94_D_as",
  authDomain: "mundial-139eb.firebaseapp.com",
  projectId: "mundial-139eb",
  storageBucket: "mundial-139eb.firebasestorage.app",
  messagingSenderId: "70061329775",
  appId: "1:70061329775:web:b24eee7ac623fe6b452c9a",
  measurementId: "G-SRWFNMVNCV"
};

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firebaseApp: FirebaseApp;
  private auth: Auth;
  private db: Firestore;

  public currentUser = signal<UserProfile | null>(null);
  public matches = signal<Match[]>([]);
  public predictions = signal<Prediction[]>([]);
  public leaderboard = signal<LeaderboardEntry[]>([]);
  public loading = signal<boolean>(false);
  public error = signal<string | null>(null);
  public allUsers = signal<UserProfile[]>([]);

  private unsubMatches: (() => void) | null = null;
  private unsubLeaderboard: (() => void) | null = null;
  private unsubPredictions: (() => void) | null = null;

  constructor() {
    this.firebaseApp = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
    this.auth = getAuth(this.firebaseApp);
    this.db = getFirestore(this.firebaseApp);

    const savedUser = localStorage.getItem('mundial_current_user');
    if (savedUser) {
      try { this.currentUser.set(JSON.parse(savedUser)); } catch {}
    }

    this.auth.onAuthStateChanged(async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const userRef = doc(this.db, 'users', fbUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          this.currentUser.set(profile);
          localStorage.setItem('mundial_current_user', JSON.stringify(profile));
        } else {
          const fallbackProfile: UserProfile = {
            uid: fbUser.uid,
            username: fbUser.email?.split('@')[0] || 'usuario_' + fbUser.uid.substring(0, 6),
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
            email: fbUser.email || '',
            role: fbUser.email === 'admin@mundial.com' ? 'admin' : 'user',
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, fallbackProfile);
          this.currentUser.set(fallbackProfile);
          localStorage.setItem('mundial_current_user', JSON.stringify(fallbackProfile));
        }
        this.fetchData().catch(console.error);
      } else {
        this.currentUser.set(null);
        localStorage.removeItem('mundial_current_user');
        this.predictions.set([]);
        this.loading.set(false);
      }
    });
  }

  // --- CARGA DE DATOS DESDE FIREBASE ---
  private async fetchData() {
    this.loading.set(true);
    try {
      const user = this.currentUser();
      const isAdmin = user?.role === 'admin';

      // --- Real-time listener: MATCHES ---
      this.unsubMatches?.();
      this.unsubMatches = onSnapshot(collection(this.db, 'matches'), async (snap) => {
        let matchList: Match[] = [];
        snap.forEach(d => matchList.push({ id: d.id, ...d.data() } as Match));

        if (matchList.length === 0) {
          const batch = writeBatch(this.db);
          INITIAL_MATCHES.forEach(m => batch.set(doc(this.db, 'matches', m.id), m));
          await batch.commit();
          matchList = [...INITIAL_MATCHES];
        }
        matchList.sort((a, b) => a.group.localeCompare(b.group) || a.order - b.order);
        this.matches.set(matchList);
      });

      // --- Real-time listener: LEADERBOARD ---
      this.unsubLeaderboard?.();

      if (isAdmin) {
        // Admin: one-time load of users for cleanup, then real-time leaderboard
        const allUsersSnap = await getDocs(collection(this.db, 'users'));
        const validUids = new Set<string>();
        allUsersSnap.forEach(d => {
          const u = d.data() as UserProfile;
          if (u.role !== 'admin') validUids.add(u.uid);
        });
        const usersList: UserProfile[] = [];
        allUsersSnap.forEach(d => usersList.push(d.data() as UserProfile));
        this.allUsers.set(usersList);

        // Cleanup orphans once
        const leaderboardSnap = await getDocs(collection(this.db, 'leaderboard'));
        const cleanupBatch = writeBatch(this.db);
        let hasOrphans = false;
        leaderboardSnap.forEach(d => {
          if (!validUids.has(d.id)) { cleanupBatch.delete(d.ref); hasOrphans = true; }
        });
        if (hasOrphans) await cleanupBatch.commit();

        this.unsubLeaderboard = onSnapshot(collection(this.db, 'leaderboard'), (snap) => {
          const list: LeaderboardEntry[] = [];
          snap.forEach(d => { if (validUids.has(d.id)) list.push(d.data() as LeaderboardEntry); });
          list.sort((a, b) => b.totalPoints - a.totalPoints);
          this.leaderboard.set(list);
        });
      } else {
        // Regular user: real-time leaderboard with deduplication by userName
        this.unsubLeaderboard = onSnapshot(collection(this.db, 'leaderboard'), (snap) => {
          const byName = new Map<string, LeaderboardEntry>();
          snap.forEach(d => {
            const entry = d.data() as LeaderboardEntry;
            const key = entry.userName.toLowerCase().trim();
            const existing = byName.get(key);
            if (!existing || entry.totalPoints > existing.totalPoints) byName.set(key, entry);
          });
          const list = Array.from(byName.values());
          list.sort((a, b) => b.totalPoints - a.totalPoints);
          this.leaderboard.set(list);
        });
      }

      // --- Real-time listener: user's own predictions ---
      this.unsubPredictions?.();
      if (user) {
        const q = query(collection(this.db, 'predictions'), where('userId', '==', user.uid));
        this.unsubPredictions = onSnapshot(q, (snap) => {
          const userPreds: Prediction[] = [];
          snap.forEach(d => userPreds.push(d.data() as Prediction));
          this.predictions.set(userPreds);
        });
      }
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      this.error.set(err.message || 'Error al obtener datos de Firebase.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- ADMIN METHODS ---
  public async adminDeleteUser(uid: string): Promise<void> {
    // Delete Firebase Auth account using stored password
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      if (userDoc.exists()) {
        const u = userDoc.data() as any;
        if (u.pwd && u.email) {
          const appName = 'DelApp_' + Date.now();
          const tempApp = initializeApp(DEFAULT_FIREBASE_CONFIG, appName);
          const tempAuth = getAuth(tempApp);
          const cred = await signInWithEmailAndPassword(tempAuth, u.email, u.pwd);
          await deleteUser(cred.user);
          await signOut(tempAuth);
        }
      }
    } catch { /* ignore auth deletion errors */ }

    const batch = writeBatch(this.db);

    // Strategy 1: query-based delete
    try {
      const predsSnap = await getDocs(query(collection(this.db, 'predictions'), where('userId', '==', uid)));
      predsSnap.forEach(d => batch.delete(d.ref));
    } catch { /* silent */ }

    // Strategy 2: delete by known document IDs (uid_group_order)
    const groups = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    for (const g of groups) {
      for (let i = 1; i <= 6; i++) {
        batch.delete(doc(this.db, 'predictions', `${uid}_${g}_${i}`));
      }
    }

    batch.delete(doc(this.db, 'leaderboard', uid));
    batch.delete(doc(this.db, 'users', uid));
    await batch.commit();

    this.allUsers.update(users => users.filter(u => u.uid !== uid));
    this.leaderboard.update(lb => lb.filter(e => e.userId !== uid));
    this.predictions.update(preds => preds.filter(p => p.userId !== uid));
  }

  public async adminUpdateUser(uid: string, name: string, username: string): Promise<void> {
    await updateDoc(doc(this.db, 'users', uid), { name, username: username.toLowerCase() });
    this.allUsers.update(users =>
      users.map(u => u.uid === uid ? { ...u, name, username: username.toLowerCase() } : u)
    );
  }

  public async adminUpdateUserPassword(uid: string, username: string, newPassword: string): Promise<void> {
    const userDoc = await getDoc(doc(this.db, 'users', uid));
    const stored = (userDoc.data() as any)?.pwd;
    if (!stored) throw new Error('Sin contraseña almacenada. Elimine y vuelva a crear el usuario.');
    const email = username.toLowerCase() + '@mundial.com';
    const appName = 'PwdApp_' + Date.now();
    const secondaryApp = initializeApp(DEFAULT_FIREBASE_CONFIG, appName);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const cred = await signInWithEmailAndPassword(secondaryAuth, email, stored);
      await updatePassword(cred.user, newPassword);
      await signOut(secondaryAuth);
      await updateDoc(doc(this.db, 'users', uid), { pwd: newPassword });
    } catch (err) {
      await signOut(secondaryAuth).catch(() => {});
      throw err;
    }
  }


  public async adminCreateUser(username: string, pass: string, name: string): Promise<void> {
    const adminUser = this.currentUser();
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Solo un administrador puede crear usuarios.');
    }

    this.loading.set(true);
    try {
      const usersRef = collection(this.db, 'users');
      const [snapUser, snapName] = await Promise.all([
        getDocs(query(usersRef, where('username', '==', username.toLowerCase()))),
        getDocs(query(usersRef, where('name', '==', name.trim())))
      ]);
      if (!snapUser.empty) throw new Error(`El usuario "${username}" ya existe.`);
      if (!snapName.empty) throw new Error(`Ya existe una cuenta con el nombre "${name.trim()}".`);

      const secondaryAppName = 'SecondaryApp_' + new Date().getTime();
      const secondaryApp = initializeApp(DEFAULT_FIREBASE_CONFIG, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      const secondaryDb = getFirestore(secondaryApp);

      const email = username.toLowerCase() + '@mundial.com';
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);

      const newProfile: UserProfile = {
        uid: cred.user.uid,
        username: username.toLowerCase(),
        name,
        email,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(secondaryDb, 'users', cred.user.uid), { ...newProfile, pwd: pass });
      await signOut(secondaryAuth);
      this.allUsers.update(users => [...users, newProfile]);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error(`El usuario "${username}" ya tiene una cuenta activa. Si fue eliminado, usa "Borrar datos" primero.`);
      }
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  public async adminSaveUserPrediction(userId: string, matchId: string, scoreA: number, scoreB: number): Promise<void> {
    const adminUser = this.currentUser();
    if (!adminUser || adminUser.role !== 'admin') {
      throw new Error('Solo un administrador puede cargar predicciones de terceros.');
    }

    const match = this.matches().find(m => m.id === matchId);
    if (!match) throw new Error('Partido no encontrado.');
    if (match.status !== 'pending') {
      throw new Error('No se pueden modificar predicciones de partidos ya jugados o en curso.');
    }

    const predId = `${userId}_${matchId}`;
    const targetUser = this.allUsers().find(u => u.uid === userId);
    const userName = targetUser ? targetUser.name : 'Usuario';

    const prediction: Prediction = {
      id: predId,
      userId: userId,
      userName: userName,
      matchId: matchId,
      scoreA,
      scoreB,
      pointsEarned: 0,
      exactScore: false,
      correctOutcome: false,
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(this.db, 'predictions', predId), prediction);
  }

  // --- AUTENTICACIÓN POR USUARIO Y CLAVE ---
  public async loginByUsername(username: string, pass: string): Promise<UserProfile> {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Build email directly from username — no pre-auth Firestore query needed
      const email = username.toLowerCase().trim() + '@mundial.com';
      const cred = await signInWithEmailAndPassword(this.auth, email, pass);

      const userRef = doc(this.db, 'users', cred.user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) throw new Error('No se encontró el perfil del usuario.');

      const finalProfile = userDoc.data() as UserProfile;
      this.currentUser.set(finalProfile);
      localStorage.setItem('mundial_current_user', JSON.stringify(finalProfile));
      this.fetchData().catch(console.error);
      return finalProfile;
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        this.error.set('Usuario o contraseña incorrectos. Intentá de nuevo.');
      } else if (err.code === 'auth/user-not-found') {
        this.error.set('El usuario "' + username + '" no existe.');
      } else if (err.code === 'auth/too-many-requests') {
        this.error.set('Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.');
      } else if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        this.error.set('Error de acceso. Verificá tus credenciales e intentá de nuevo.');
      } else {
        this.error.set(err.message || 'Error al iniciar sesión.');
      }
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  public async register(email: string, username: string, name: string, pass: string): Promise<UserProfile> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const usernameClean = username.toLowerCase().trim();
      const role = usernameClean === 'admin' ? 'admin' : 'user';

      const usersRef = collection(this.db, 'users');
      const qCheck = query(usersRef, where('username', '==', usernameClean));
      const checkSnap = await getDocs(qCheck);
      if (!checkSnap.empty) {
        throw new Error('El usuario "' + username + '" ya está en uso. Elegí otro.');
      }

      const cred = await createUserWithEmailAndPassword(this.auth, email, pass);
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        username: usernameClean,
        name,
        email,
        role,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(this.db, 'users', cred.user.uid), newProfile);
      this.currentUser.set(newProfile);
      localStorage.setItem('mundial_current_user', JSON.stringify(newProfile));
      this.fetchData().catch(console.error);
      return newProfile;
    } catch (err: any) {
      this.error.set(err.message || 'Error al registrarse');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  public async logout() {
    this.loading.set(true);
    this.unsubMatches?.();     this.unsubMatches = null;
    this.unsubLeaderboard?.();  this.unsubLeaderboard = null;
    this.unsubPredictions?.();  this.unsubPredictions = null;
    try {
      await signOut(this.auth);
      this.currentUser.set(null);
      localStorage.removeItem('mundial_current_user');
      this.predictions.set([]);
    } catch (err: any) {
      this.error.set(err.message || 'Error al cerrar sesión');
    } finally {
      this.loading.set(false);
    }
  }

  // --- PREDICTIONS HANDLING ---
  public async savePrediction(matchId: string, scoreA: number | null, scoreB: number | null): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('Debes iniciar sesión para guardar predicciones.');

    const match = this.matches().find(m => m.id === matchId);
    if (!match) throw new Error('Partido no encontrado.');
    if (match.status === 'played') throw new Error('No puedes predecir un partido que ya se ha jugado.');

    this.loading.set(true);
    try {
      const predId = `${user.uid}_${matchId}`;
      
      // Calculate points if the match was already played (normally it shouldn't be, but let's be safe)
      const calculation = this.calculateMatchPoints(scoreA, scoreB, match.scoreA, match.scoreB, match.status);

      const prediction: Prediction = {
        id: predId,
        userId: user.uid,
        userName: user.name,
        matchId: matchId,
        scoreA: scoreA,
        scoreB: scoreB,
        pointsEarned: calculation.points,
        exactScore: calculation.exact,
        correctOutcome: calculation.outcome,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(this.db, 'predictions', predId), prediction);
      const updated = [...this.predictions().filter(p => p.matchId !== matchId), prediction];
      this.predictions.set(updated);
    } catch (err: any) {
      this.error.set(err.message || 'Error al guardar la predicción.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // --- ADMIN ACTIONS ---
  public async updateMatchScore(matchId: string, scoreA: number | null, scoreB: number | null, status: 'pending' | 'played' | 'cancelled'): Promise<void> {
    const user = this.currentUser();
    if (!user || user.role !== 'admin') throw new Error('Acceso denegado. Se requieren permisos de administrador.');

    this.loading.set(true);
    try {
      await updateDoc(doc(this.db, 'matches', matchId), { scoreA, scoreB, status });
      const updatedMatches = this.matches().map(m => m.id === matchId ? { ...m, scoreA, scoreB, status } : m);
      this.matches.set(updatedMatches);
      await this.recalculatePointsForMatchFirebase(matchId, scoreA, scoreB, status);
      await this.recalculateLeaderboardFirebase();
    } catch (err: any) {
      this.error.set(err.message || 'Error al actualizar resultado.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  public async autoPopulateOfficialScores(): Promise<void> {
    const user = this.currentUser();
    if (!user || user.role !== 'admin') throw new Error('Acceso denegado. Se requieren permisos de administrador.');

    this.loading.set(true);
    try {
      const batch = writeBatch(this.db);
      const updatedMatches = this.matches().map(m => {
        const official = OFFICIAL_SCORES_FROM_IMAGE[m.id];
        if (official) {
          batch.update(doc(this.db, 'matches', m.id), {
            scoreA: official.scoreA,
            scoreB: official.scoreB,
            status: official.status
          });
          return { ...m, scoreA: official.scoreA, scoreB: official.scoreB, status: official.status };
        }
        return m;
      });
      await batch.commit();
      this.matches.set(updatedMatches);
      await this.recalculateAllPredictionsFirebase(updatedMatches);
      await this.recalculateLeaderboardFirebase();
    } catch (err: any) {
      this.error.set(err.message || 'Error al auto-poblar puntuaciones oficiales.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  public async adminFullReset(): Promise<void> {
    const adminUid = this.currentUser()?.uid;
    if (!adminUid) throw new Error('No hay admin autenticado.');
    this.loading.set(true);
    try {
      const [predsSnap, lbSnap, usersSnap] = await Promise.all([
        getDocs(collection(this.db, 'predictions')),
        getDocs(collection(this.db, 'leaderboard')),
        getDocs(collection(this.db, 'users'))
      ]);

      // Delete Firebase Auth accounts using stored passwords
      for (const d of usersSnap.docs) {
        if (d.id === adminUid) continue;
        const u = d.data() as any;
        if (!u.pwd || !u.email) continue;
        try {
          const appName = 'DelApp_' + Date.now() + '_' + d.id;
          const tempApp = initializeApp(DEFAULT_FIREBASE_CONFIG, appName);
          const tempAuth = getAuth(tempApp);
          const cred = await signInWithEmailAndPassword(tempAuth, u.email, u.pwd);
          await deleteUser(cred.user);
          await signOut(tempAuth);
        } catch { /* ignore individual errors */ }
      }

      // Delete Firestore documents
      const batch = writeBatch(this.db);
      predsSnap.forEach(d => batch.delete(d.ref));
      lbSnap.forEach(d => batch.delete(d.ref));
      usersSnap.forEach(d => { if (d.id !== adminUid) batch.delete(d.ref); });
      await batch.commit();

      this.predictions.set([]);
      this.leaderboard.set([]);
      this.allUsers.set([]);
    } catch (err: any) {
      this.error.set(err.message || 'Error al reiniciar datos.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  public async resetAllMatches(): Promise<void> {
    const user = this.currentUser();
    if (!user || user.role !== 'admin') throw new Error('Acceso denegado.');

    this.loading.set(true);
    try {
      const batch = writeBatch(this.db);
      const resetMatches = this.matches().map(m => {
        const status: 'pending' | 'played' | 'cancelled' = (m.id === 'A_1' || m.id === 'A_2') ? 'cancelled' : 'pending';
        batch.update(doc(this.db, 'matches', m.id), { scoreA: null, scoreB: null, status });
        return { ...m, scoreA: null, scoreB: null, status } as Match;
      });
      await batch.commit();
      this.matches.set(resetMatches);

      const predsSnap = await getDocs(collection(this.db, 'predictions'));
      const predBatch = writeBatch(this.db);
      predsSnap.forEach(d => predBatch.update(d.ref, { pointsEarned: 0, exactScore: false, correctOutcome: false }));
      await predBatch.commit();

      await this.recalculateLeaderboardFirebase();
      await this.fetchData();
    } catch (err: any) {
      this.error.set(err.message || 'Error al reiniciar partidos.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // --- CORE ENGINE: POINTS CALCULATION ---
  public calculateMatchPoints(
    predA: number | null,
    predB: number | null,
    realA: number | null,
    realB: number | null,
    status: 'pending' | 'played' | 'cancelled'
  ): { points: number; exact: boolean; outcome: boolean } {
    if (status === 'cancelled') {
      return { points: 0, exact: false, outcome: false };
    }

    if (predA === null || predB === null || realA === null || realB === null || status !== 'played') {
      return { points: 0, exact: false, outcome: false };
    }

    const predictedOutcome = predA > predB ? 'A' : predA < predB ? 'B' : 'Draw';
    const realOutcome = realA > realB ? 'A' : realA < realB ? 'B' : 'Draw';

    const correctOutcome = predictedOutcome === realOutcome;
    const exactScore = predA === realA && predB === realB;

    let points = 0;
    if (correctOutcome) {
      points += 2;
      if (exactScore) {
        points += 1; // 1 extra point for exact score = 3 total points
      }
    }

    return {
      points,
      exact: exactScore,
      outcome: correctOutcome
    };
  }

  // --- HELPERS DE CÁLCULO FIREBASE ---
  private async recalculatePointsForMatchFirebase(
    matchId: string,
    realA: number | null,
    realB: number | null,
    status: 'pending' | 'played' | 'cancelled'
  ) {
    const q = query(collection(this.db, 'predictions'), where('matchId', '==', matchId));
    const predsSnap = await getDocs(q);
    const batch = writeBatch(this.db);
    predsSnap.forEach(d => {
      const p = d.data() as Prediction;
      const calc = this.calculateMatchPoints(p.scoreA, p.scoreB, realA, realB, status);
      batch.update(d.ref, { pointsEarned: calc.points, exactScore: calc.exact, correctOutcome: calc.outcome });
    });
    await batch.commit();
  }

  private async recalculateAllPredictionsFirebase(matchesList: Match[]) {
    const predsSnap = await getDocs(collection(this.db, 'predictions'));
    const batch = writeBatch(this.db);
    predsSnap.forEach(d => {
      const p = d.data() as Prediction;
      const match = matchesList.find(m => m.id === p.matchId);
      if (match) {
        const calc = this.calculateMatchPoints(p.scoreA, p.scoreB, match.scoreA, match.scoreB, match.status);
        batch.update(d.ref, { pointsEarned: calc.points, exactScore: calc.exact, correctOutcome: calc.outcome });
      }
    });
    await batch.commit();
  }

  private async recalculateLeaderboardFirebase() {
    const usersSnap = await getDocs(collection(this.db, 'users'));
    const adminUids = new Set<string>();
    const userStats: { [uid: string]: { name: string; points: number; exact: number; outcome: number; incorrect: number } } = {};

    usersSnap.forEach(d => {
      const u = d.data() as UserProfile;
      if (u.role === 'admin') { adminUids.add(u.uid); return; }
      if (!userStats[u.uid]) userStats[u.uid] = { name: u.name, points: 0, exact: 0, outcome: 0, incorrect: 0 };
    });

    const predsSnap = await getDocs(collection(this.db, 'predictions'));
    predsSnap.forEach(d => {
      const p = d.data() as Prediction;
      if (adminUids.has(p.userId)) return; // saltar predicciones de admin
      if (!userStats[p.userId]) userStats[p.userId] = { name: p.userName || 'Usuario', points: 0, exact: 0, outcome: 0, incorrect: 0 };
      if (p.pointsEarned === 3) { userStats[p.userId].points += 3; userStats[p.userId].exact++; }
      else if (p.pointsEarned === 2) { userStats[p.userId].points += 2; userStats[p.userId].outcome++; }
      else if (p.pointsEarned === 0 && p.scoreA !== null && p.scoreB !== null) { userStats[p.userId].incorrect++; }
    });

    const batch = writeBatch(this.db);
    const leaderboardList: LeaderboardEntry[] = [];
    Object.keys(userStats).forEach(uid => {
      const stats = userStats[uid];
      const entry: LeaderboardEntry = {
        userId: uid,
        userName: stats.name,
        totalPoints: stats.points,
        exactScoresCount: stats.exact,
        correctOutcomesCount: stats.outcome,
        incorrectCount: stats.incorrect
      };
      leaderboardList.push(entry);
      batch.set(doc(this.db, 'leaderboard', uid), entry);
    });

    // Delete orphaned leaderboard entries (deleted users)
    const existingSnap = await getDocs(collection(this.db, 'leaderboard'));
    existingSnap.forEach(d => {
      if (!userStats[d.id]) batch.delete(d.ref);
    });

    await batch.commit();
    leaderboardList.sort((a, b) => b.totalPoints - a.totalPoints);
    this.leaderboard.set(leaderboardList);
  }

  // --- STATS HELPER FOR STANDINGS IN A GROUP ---
  public getStandingsForGroup(groupName: string): GroupStanding[] {
    const groupMatches = this.matches().filter(m => m.group === groupName);
    const standingsMap: { [teamName: string]: GroupStanding } = {};

    // Initialize standings map with all teams in the group
    groupMatches.forEach(m => {
      if (!standingsMap[m.teamA]) {
        standingsMap[m.teamA] = { team: m.teamA, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      }
      if (!standingsMap[m.teamB]) {
        standingsMap[m.teamB] = { team: m.teamB, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      }
    });

    // Calculate standings based on played matches
    groupMatches.forEach(m => {
      if (m.status !== 'played' || m.scoreA === null || m.scoreB === null) return;

      const sA = standingsMap[m.teamA];
      const sB = standingsMap[m.teamB];

      sA.played++;
      sB.played++;
      sA.gf += m.scoreA;
      sA.ga += m.scoreB;
      sB.gf += m.scoreB;
      sB.ga += m.scoreA;

      if (m.scoreA > m.scoreB) {
        sA.won++;
        sA.points += 3;
        sB.lost++;
      } else if (m.scoreA < m.scoreB) {
        sB.won++;
        sB.points += 3;
        sA.lost++;
      } else {
        sA.drawn++;
        sA.points += 1;
        sB.drawn++;
        sB.points += 1;
      }
    });

    // Compute goal difference and convert to array
    const standings = Object.values(standingsMap).map(s => {
      s.gd = s.gf - s.ga;
      return s;
    });

    // Sort standings: Points DESC, Goal Difference DESC, Goals For DESC, Name ASC
    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.team.localeCompare(b.team);
    });
  }
}
