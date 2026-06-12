import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { Match, Prediction, GroupStanding } from '../../models/models';

@Component({
  selector: 'app-group-stage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-stage.component.html'
})
export class GroupStageComponent {
  public firebaseService = inject(FirebaseService);

  // Group selection state
  groups: ('A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L')[] = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'
  ];
  selectedGroup = signal<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'>('A');

  // Local state to hold unsaved input values
  // Key format: "matchId_team" (e.g. "A_3_A" or "A_3_B")
  inputValues = signal<{ [key: string]: number | null }>({});

  // Status message for each match: "saving", "saved", "error"
  saveStatus = signal<{ [matchId: string]: 'saving' | 'saved' | 'error' | null }>({});

  // Computed matches of selected group
  groupMatches = computed(() => {
    return this.firebaseService.matches().filter(m => m.group === this.selectedGroup());
  });

  // Computed standings of selected group
  groupStandings = computed<GroupStanding[]>(() => {
    return this.firebaseService.getStandingsForGroup(this.selectedGroup());
  });

  // Computed predictions mapped by matchId for the current user
  userPredictionsMap = computed(() => {
    const map: { [matchId: string]: Prediction } = {};
    this.firebaseService.predictions().forEach(p => {
      map[p.matchId] = p;
    });
    return map;
  });

  // Select group and reset local input states
  selectGroup(g: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L') {
    this.selectedGroup.set(g);
  }

  // Helper to get predicted score or local input value
  getScore(matchId: string, team: 'A' | 'B'): number | '' {
    const key = `${matchId}_${team}`;
    const localValues = this.inputValues();
    if (key in localValues) {
      // El usuario interactuó con este input: null = campo vacío
      const localVal = localValues[key];
      return localVal !== null ? localVal : '';
    }

    // Sin estado local, usar la predicción guardada
    const prediction = this.userPredictionsMap()[matchId];
    if (prediction) {
      const score = team === 'A' ? prediction.scoreA : prediction.scoreB;
      return score !== null ? score : '';
    }
    return '';
  }

  // Handle score change from UI
  onScoreChange(matchId: string, team: 'A' | 'B', event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const numVal = val === '' ? null : parseInt(val, 10);
    
    // Update local state
    const key = `${matchId}_${team}`;
    this.inputValues.update(prev => ({ ...prev, [key]: numVal }));

    // Try to auto-save if both scores are entered
    this.checkAndAutoSave(matchId);
  }

  // Check if both score inputs have values, then save prediction
  private async checkAndAutoSave(matchId: string) {
    const scoreA = this.getScore(matchId, 'A');
    const scoreB = this.getScore(matchId, 'B');

    // Only save if both inputs are valid numbers
    if (scoreA !== '' && scoreB !== '') {
      this.saveStatus.update(prev => ({ ...prev, [matchId]: 'saving' }));
      try {
        await this.firebaseService.savePrediction(matchId, scoreA as number, scoreB as number);
        
        // Show "saved" state briefly
        this.saveStatus.update(prev => ({ ...prev, [matchId]: 'saved' }));
        setTimeout(() => {
          this.saveStatus.update(prev => ({ ...prev, [matchId]: null }));
        }, 2000);
      } catch (err) {
        console.error('Error auto-saving prediction:', err);
        this.saveStatus.update(prev => ({ ...prev, [matchId]: 'error' }));
      }
    }
  }

  // Computed: total points earned by user in the current selected group
  groupPointsSummary = computed(() => {
    const matches = this.groupMatches();
    const preds = this.userPredictionsMap();
    let total = 0, exact = 0, outcome = 0, incorrect = 0, pending = 0;
    matches.forEach(m => {
      if (m.status !== 'played') { if (m.status === 'pending') pending++; return; }
      const p = preds[m.id];
      if (!p) { return; }
      total += p.pointsEarned;
      if (p.exactScore) exact++;
      else if (p.correctOutcome) outcome++;
      else if (p.scoreA !== null && p.scoreB !== null) incorrect++;
    });
    return { total, exact, outcome, incorrect, pending };
  });

  // Helper to get prediction points details for played matches
  getPredictionPointsInfo(matchId: string): { points: number; exact: boolean; outcome: boolean; prediction: Prediction | null } {
    const prediction = this.userPredictionsMap()[matchId];
    if (!prediction) {
      return { points: 0, exact: false, outcome: false, prediction: null };
    }
    return {
      points: prediction.pointsEarned,
      exact: prediction.exactScore,
      outcome: prediction.correctOutcome,
      prediction
    };
  }
}
