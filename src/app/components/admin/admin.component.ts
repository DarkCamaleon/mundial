import { Component, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { Match, UserProfile, Prediction } from '../../models/models';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent {
  public firebaseService = inject(FirebaseService);
  private toastr = inject(ToastrService);
  view = input<'matches' | 'users' | 'cartola'>('matches');

  // Group selection state for admin
  groups: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L')[] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'
  ];
  selectedGroup = signal<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'>('A');

  // --- Cartola / User Management State ---
  newUser = { username: '', name: '', password: '' };
  createUserStatus = signal<{ state: 'idle' | 'loading' | 'success' | 'error', message: string }>({ state: 'idle', message: '' });

  ownPwd = { current: '', next: '' };
  ownPwdStatus = signal<{ state: 'idle' | 'loading' | 'success' | 'error', message: string }>({ state: 'idle', message: '' });

  selectedUserId = signal<string | null>(null);
  selectedUserPredictions = signal<{ [matchId: string]: Prediction }>({});
  userLocalScores = signal<{ [matchId: string]: { scoreA: number | null, scoreB: number | null } }>({});
  cartolaSaveStatus = signal<{ [matchId: string]: 'saving' | 'saved' | 'error' | null }>({});

  // Computed: Only non-admin users for cartola
  regularUsers = computed(() => {
    return this.firebaseService.allUsers().filter(u => u.role !== 'admin');
  });

  // Computed: Get currently selected user profile
  selectedUserProfile = computed(() => {
    return this.firebaseService.allUsers().find(u => u.uid === this.selectedUserId()) || null;
  });

  // --- User edit/delete state ---
  editingUserId = signal<string | null>(null);
  editForm = { name: '', username: '', password: '' };
  editUserStatus = signal<{ state: 'idle' | 'loading' | 'success' | 'error', message: string }>({ state: 'idle', message: '' });

  startEditUser(user: any) {
    this.editingUserId.set(user.uid);
    this.editForm = { name: user.name, username: user.username, password: '' };
    this.editUserStatus.set({ state: 'idle', message: '' });
  }

  cancelEditUser() {
    this.editingUserId.set(null);
    this.editUserStatus.set({ state: 'idle', message: '' });
  }

  async saveEditUser(uid: string, currentUsername: string) {
    if (!this.editForm.name.trim() || !this.editForm.username.trim()) {
      this.editUserStatus.set({ state: 'error', message: 'Nombre y usuario son requeridos.' });
      return;
    }
    if (this.editForm.password && this.editForm.password.length < 6) {
      this.editUserStatus.set({ state: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    this.editUserStatus.set({ state: 'loading', message: '' });
    try {
      await this.firebaseService.adminUpdateUser(uid, this.editForm.name.trim(), this.editForm.username.trim());
      if (this.editForm.password.trim()) {
        await this.firebaseService.adminUpdateUserPassword(uid, currentUsername, this.editForm.password.trim());
      }
      this.editingUserId.set(null);
      this.editUserStatus.set({ state: 'idle', message: '' });
      this.toastr.success('Usuario actualizado correctamente.', 'Guardado');
    } catch (err: any) {
      this.editUserStatus.set({ state: 'error', message: err.message });
      this.toastr.error(err.message, 'Error al actualizar');
    }
  }

  async deleteUser(uid: string, username: string) {
    const result = await Swal.fire({
      title: `¿Eliminar "${username}"?`,
      text: 'Se eliminará el usuario y todo su historial de predicciones. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0',
    });
    if (!result.isConfirmed) return;
    try {
      await this.firebaseService.adminDeleteUser(uid);
      this.toastr.success(`Usuario "${username}" eliminado.`, 'Eliminado');
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al eliminar', 'Error');
    }
  }

  // Local scores input states to avoid direct signal editing during typing
  // Keys are matchId
  localScores = signal<{ [matchId: string]: { scoreA: number | null, scoreB: number | null, status: 'pending' | 'played' | 'cancelled' } }>({});

  // Per-match save feedback
  matchSaveStatus = signal<{ [matchId: string]: 'saving' | 'saved' | 'error' | null }>({});
  private autoSaveTimers: { [matchId: string]: ReturnType<typeof setTimeout> } = {};

  // Computed matches of selected group
  groupMatches = computed(() => {
    return this.firebaseService.matches().filter(m => m.group === this.selectedGroup());
  });

  // Separate group state for cartola (independent from match editor)
  cartolaGroup = signal<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'>('A');

  // Computed matches for the cartola group selector
  cartolaGroupMatches = computed(() => {
    return this.firebaseService.matches().filter(m => m.group === this.cartolaGroup());
  });

  selectGroup(g: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L') {
    this.selectedGroup.set(g);
  }

  selectCartolaGroup(g: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L') {
    this.cartolaGroup.set(g);
  }

  // Get local score input or default to current match value
  getScore(matchId: string, team: 'A' | 'B', defaultValue: number | null): number | '' {
    const local = this.localScores()[matchId];
    if (local) {
      const val = team === 'A' ? local.scoreA : local.scoreB;
      return val !== null ? val : '';
    }
    return defaultValue !== null ? defaultValue : '';
  }

  // Get local status or default to current match status
  getStatus(matchId: string, defaultStatus: 'pending' | 'played' | 'cancelled'): 'pending' | 'played' | 'cancelled' {
    const local = this.localScores()[matchId];
    return local ? local.status : defaultStatus;
  }

  // Update local input state
  onScoreChange(matchId: string, team: 'A' | 'B', match: Match, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const numVal = val === '' ? null : parseInt(val, 10);

    const current = this.localScores()[matchId] || {
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      status: match.status
    };

    if (team === 'A') {
      current.scoreA = numVal;
    } else {
      current.scoreB = numVal;
    }

    // Auto toggle to 'played' if scores are entered, unless cancelled
    if (current.scoreA !== null && current.scoreB !== null && current.status === 'pending') {
      current.status = 'played';
    }

    this.localScores.update(prev => ({ ...prev, [matchId]: { ...current } }));

    // Auto-save when both scores are ready
    if (current.scoreA !== null && current.scoreB !== null && current.status === 'played') {
      clearTimeout(this.autoSaveTimers[matchId]);
      this.autoSaveTimers[matchId] = setTimeout(() => {
        this.saveMatchScore(match);
      }, 600);
    }
  }

  // Update local status state + auto-save for cancelled/pending
  onStatusChange(matchId: string, match: Match, event: Event) {
    const status = (event.target as HTMLSelectElement).value as 'pending' | 'played' | 'cancelled';
    
    const current = this.localScores()[matchId] || {
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      status: match.status
    };

    current.status = status;
    if (status === 'pending') {
      current.scoreA = null;
      current.scoreB = null;
    }

    this.localScores.update(prev => ({ ...prev, [matchId]: { ...current } }));

    // Auto-save immediately for cancelled/pending, or for played if both scores ready
    const shouldSave = status === 'cancelled' || status === 'pending' ||
      (status === 'played' && current.scoreA !== null && current.scoreB !== null);
    if (shouldSave) {
      clearTimeout(this.autoSaveTimers[matchId]);
      this.autoSaveTimers[matchId] = setTimeout(() => this.saveMatchScore(match), 300);
    }
  }

  // Save official match score
  async saveMatchScore(match: Match) {
    const local = this.localScores()[match.id] || {
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      status: match.status
    };

    if (local.status === 'played' && (local.scoreA === null || local.scoreB === null)) {
      this.matchSaveStatus.update(s => ({ ...s, [match.id]: 'error' }));
      return;
    }

    this.matchSaveStatus.update(s => ({ ...s, [match.id]: 'saving' }));
    try {
      await this.firebaseService.updateMatchScore(match.id, local.scoreA, local.scoreB, local.status);
      this.matchSaveStatus.update(s => ({ ...s, [match.id]: 'saved' }));
      setTimeout(() => this.matchSaveStatus.update(s => ({ ...s, [match.id]: null })), 3000);
    } catch (err: any) {
      this.matchSaveStatus.update(s => ({ ...s, [match.id]: 'error' }));
      this.toastr.error(err.message || 'Error al guardar resultado', 'Error');
    }
  }

  // Quick Action: Auto Populate all matches from images
  async onAutoPopulate() {
    const result = await Swal.fire({
      title: '¿Cargar resultados?',
      text: 'Esto actualizará los marcadores de todos los grupos y recalculará los puntos de los usuarios.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, cargar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0',
    });
    if (!result.isConfirmed) return;
    try {
      await this.firebaseService.autoPopulateOfficialScores();
      this.localScores.set({});
      this.toastr.success('Resultados cargados y puntos recalculados.', 'Éxito');
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al cargar resultados', 'Error');
    }
  }

  // Quick Action: Reset matches
  async onResetMatches() {
    const result = await Swal.fire({
      title: '¿Reiniciar todo?',
      text: 'Se borrarán todos los resultados oficiales y los puntos se restablecen a cero. Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, reiniciar',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0',
    });
    if (!result.isConfirmed) return;
    try {
      await this.firebaseService.resetAllMatches();
      this.localScores.set({});
      this.toastr.success('Resultados reiniciados correctamente.', 'Éxito');
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al reiniciar', 'Error');
    }
  }

  async onLockPredictions(lock: boolean) {
    try {
      await this.firebaseService.setLockPredictions(lock);
      this.toastr.success(
        lock ? 'Predicciones bloqueadas. Los usuarios no pueden escribir.' : 'Predicciones habilitadas.',
        lock ? '🔒 Bloqueado' : '🔓 Habilitado'
      );
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al cambiar el estado.', 'Error');
    }
  }

  // Full reset: delete all users (except admin), predictions, leaderboard
  async onFullReset() {
    const result = await Swal.fire({
      title: '¿Borrar todos los datos?',
      html: 'Se eliminarán <b>todos los usuarios, predicciones y el leaderboard</b>.<br>Solo quedará el admin y los grupos.<br><br>Esta acción <b>no se puede deshacer</b>.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0',
    });
    if (!result.isConfirmed) return;
    try {
      await this.firebaseService.adminFullReset();
      this.toastr.success('Datos borrados. Solo queda el admin y los grupos.', 'Reset completado');
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al borrar datos', 'Error');
    }
  }

  // --- CARTOLA: User Management ---

  async onCreateUser() {
    if (!this.newUser.username || !this.newUser.name || !this.newUser.password) {
      this.createUserStatus.set({ state: 'error', message: 'Todos los campos son obligatorios.' });
      return;
    }
    
    this.createUserStatus.set({ state: 'loading', message: 'Creando usuario...' });
    try {
      await this.firebaseService.adminCreateUser(this.newUser.username, this.newUser.password, this.newUser.name);
      this.toastr.success(`Usuario "${this.newUser.username}" creado con éxito.`, 'Usuario creado');
      this.newUser = { username: '', name: '', password: '' };
      this.createUserStatus.set({ state: 'idle', message: '' });
    } catch (err: any) {
      this.createUserStatus.set({ state: 'error', message: err.message || 'Error al crear usuario.' });
    }
  }

  async onChangeOwnPassword() {
    if (!this.ownPwd.current || !this.ownPwd.next) {
      this.ownPwdStatus.set({ state: 'error', message: 'Completá ambos campos.' });
      return;
    }
    if (this.ownPwd.next.length < 6) {
      this.ownPwdStatus.set({ state: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    this.ownPwdStatus.set({ state: 'loading', message: '' });
    try {
      await this.firebaseService.adminUpdateOwnPassword(this.ownPwd.current, this.ownPwd.next);
      this.ownPwd = { current: '', next: '' };
      this.ownPwdStatus.set({ state: 'success', message: 'Contraseña actualizada correctamente.' });
      this.toastr.success('Tu contraseña fue cambiada.', 'Éxito');
    } catch (err: any) {
      const msg = (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')
        ? 'La contraseña actual es incorrecta.'
        : (err.message || 'Error al cambiar la contraseña.');
      this.ownPwdStatus.set({ state: 'error', message: msg });
    }
  }

  async selectCartolaUser(userId: string) {
    if (this.selectedUserId() === userId) {
      this.selectedUserId.set(null);
      this.selectedUserPredictions.set({});
      this.userLocalScores.set({});
      return;
    }

    this.selectedUserId.set(userId);
    this.selectedUserPredictions.set({});
    this.userLocalScores.set({});

    // Load their predictions from Firestore
    try {
      const db = this.firebaseService['db'];
      const q = query(collection(db, 'predictions'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const preds: { [matchId: string]: Prediction } = {};
      snap.forEach(doc => {
        const p = doc.data() as Prediction;
        preds[p.matchId] = p;
      });
      this.selectedUserPredictions.set(preds);
    } catch (err) {
      console.error('Error loading user predictions', err);
    }
  }

  getUserScore(matchId: string, team: 'A' | 'B'): number | '' {
    const local = this.userLocalScores()[matchId];
    if (local) {
      const val = team === 'A' ? local.scoreA : local.scoreB;
      return val !== null ? val : '';
    }
    const pred = this.selectedUserPredictions()[matchId];
    if (pred) {
      const val = team === 'A' ? pred.scoreA : pred.scoreB;
      return val !== null ? val : '';
    }
    return '';
  }

  onUserScoreChange(matchId: string, team: 'A' | 'B', event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const numVal = val === '' ? null : parseInt(val, 10);

    const current = this.userLocalScores()[matchId] || { scoreA: null, scoreB: null };
    
    // If not in local state yet, initialize from current prediction
    const pred = this.selectedUserPredictions()[matchId];
    if (!this.userLocalScores()[matchId] && pred) {
      current.scoreA = pred.scoreA;
      current.scoreB = pred.scoreB;
    }

    if (team === 'A') current.scoreA = numVal;
    else current.scoreB = numVal;

    this.userLocalScores.update(prev => ({ ...prev, [matchId]: current }));
  }

  async saveUserPrediction(matchId: string) {
    const userId = this.selectedUserId();
    if (!userId) return;

    const scores = this.userLocalScores()[matchId];
    if (!scores || scores.scoreA === null || scores.scoreB === null) {
      this.toastr.warning('Ingresa los dos goles antes de guardar.', 'Faltan datos');
      return;
    }

    this.cartolaSaveStatus.update(prev => ({ ...prev, [matchId]: 'saving' }));
    try {
      await this.firebaseService.adminSaveUserPrediction(userId, matchId, scores.scoreA, scores.scoreB);
      this.cartolaSaveStatus.update(prev => ({ ...prev, [matchId]: 'saved' }));
      
      // Update local copy
      const pred = this.selectedUserPredictions()[matchId] || {} as Prediction;
      pred.scoreA = scores.scoreA;
      pred.scoreB = scores.scoreB;
      this.selectedUserPredictions.update(prev => ({ ...prev, [matchId]: pred }));

      setTimeout(() => {
        this.cartolaSaveStatus.update(prev => ({ ...prev, [matchId]: null }));
      }, 2000);
    } catch (err: any) {
      this.toastr.error(err.message || 'Error al guardar predicción', 'Error');
      this.cartolaSaveStatus.update(prev => ({ ...prev, [matchId]: 'error' }));
    }
  }
}
