import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  username = '';
  password = '';
  
  loading = this.firebaseService.loading;
  error = this.firebaseService.error;

  async onSubmit() {
    if (!this.username || !this.password) {
      this.firebaseService.error.set('Por favor, completa todos los campos.');
      return;
    }

    try {
      await this.firebaseService.loginByUsername(this.username.trim(), this.password);
      const name = this.firebaseService.currentUser()?.name || this.username;
      this.toastr.success(`¡Bienvenido de vuelta, ${name}! 🏆`, 'Sesión iniciada');
      this.router.navigate(['/']);
    } catch (err) {
      // El error ya lo setea el servicio
    }
  }

  useDemoAdmin() {
    this.username = 'admin';
    this.password = 'admin123';
    this.onSubmit();
  }

}
