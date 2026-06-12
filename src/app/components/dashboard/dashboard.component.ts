import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { GroupStageComponent } from '../group-stage/group-stage.component';
import { AdminComponent } from '../admin/admin.component';
import { LeaderboardEntry } from '../../models/models';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, GroupStageComponent, AdminComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  public firebaseService = inject(FirebaseService);
  private router = inject(Router);

  // Active view tab
  activeTab = signal<'predictions' | 'leaderboard' | 'rules' | 'admin' | 'users' | 'cartola'>('predictions');

  // Sidebar / Mobile menu collapse state
  sidebarOpen = signal<boolean>(false);

  // Current user signal
  currentUser = this.firebaseService.currentUser;

  // Sorted leaderboard list
  leaderboardList = this.firebaseService.leaderboard;

  // Computed: Current user's rank and points from leaderboard
  userStats = computed(() => {
    const user = this.currentUser();
    if (!user) return { rank: '-', points: 0, exact: 0, outcome: 0 };
    
    const index = this.leaderboardList().findIndex(e => e.userId === user.uid);
    if (index === -1) return { rank: '-', points: 0, exact: 0, outcome: 0 };

    const entry = this.leaderboardList()[index];
    return {
      rank: index + 1,
      points: entry.totalPoints,
      exact: entry.exactScoresCount,
      outcome: entry.correctOutcomesCount
    };
  });

  // Podium top 3 computed list
  podium = computed(() => {
    const list = this.leaderboardList();
    return {
      first: list.length > 0 ? list[0] : null,
      second: list.length > 1 ? list[1] : null,
      third: list.length > 2 ? list[2] : null,
      others: list.slice(3)
    };
  });

  constructor() {
    let tabInitialized = false;
    effect(() => {
      const user = this.firebaseService.currentUser();
      const loading = this.firebaseService.loading();
      if (!user && !loading) {
        this.router.navigate(['/login']);
        tabInitialized = false;
      } else if (user && !tabInitialized) {
        tabInitialized = true;
        if (user.role === 'admin') {
          this.activeTab.set('admin');
        }
      }
    });
  }

  setTab(tab: 'predictions' | 'leaderboard' | 'rules' | 'admin' | 'users' | 'cartola') {
    this.activeTab.set(tab);
    this.sidebarOpen.set(false); // Close mobile sidebar on select
  }

  async logout() {
    const result = await Swal.fire({
      title: '¿Cerrando sesión?',
      text: 'Tu progreso está guardado. ¡Hasta la próxima!',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      background: '#0f172a',
      color: '#e2e8f0',
    });
    if (!result.isConfirmed) return;
    await this.firebaseService.logout();
    this.router.navigate(['/login']);
  }
}
