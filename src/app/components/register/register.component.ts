import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private firebaseService = inject(FirebaseService);
  private router = inject(Router);

  name = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  
  loading = this.firebaseService.loading;
  error = this.firebaseService.error;

  async onSubmit() {
    this.firebaseService.error.set(null);

    if (!this.name || !this.username || !this.email || !this.password || !this.confirmPassword) {
      this.firebaseService.error.set('Por favor, completa todos los campos.');
      return;
    }

    // Validar formato de username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(this.username)) {
      this.firebaseService.error.set('El usuario solo puede tener letras, números y guion bajo (3-20 caracteres).');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.firebaseService.error.set('Las contraseñas no coinciden.');
      return;
    }

    if (this.password.length < 6) {
      this.firebaseService.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      await this.firebaseService.register(this.email, this.username.toLowerCase(), this.name, this.password);
      this.router.navigate(['/']);
    } catch (err) {
      // El error ya lo setea el servicio
    }
  }
}
