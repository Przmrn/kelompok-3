import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { map } from 'rxjs';
import { User, UserRole } from '../models/course-system.models';

interface ApiUser extends Omit<User, 'role'> {
  role: 'STUDENT' | 'ADMIN' | 'INSTRUCTOR';
}

interface LoginResponse {
  user: ApiUser;
  token: string;
  expiresAt: string;
}

const roles: Record<ApiUser['role'], UserRole> = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
};

const sessionKey = 'karsa.auth';

function isActive(session: LoginResponse | null): session is LoginResponse {
  const user = session?.user;
  return !!session && typeof session.token === 'string' && !!session.token &&
    Date.parse(session.expiresAt) > Date.now() && !!user &&
    Number.isSafeInteger(user.id) && user.id > 0 &&
    typeof user.fullName === 'string' && typeof user.email === 'string' &&
    Object.prototype.hasOwnProperty.call(roles, user.role);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<LoginResponse | null>(null);
  private expiryTimer?: ReturnType<typeof setTimeout>;
  readonly user = computed<User | null>(() => {
    const user = this.session()?.user;
    return user ? { ...user, role: roles[user.role] } : null;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.expiryTimer));
    try {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        const session = JSON.parse(stored);
        if (isActive(session)) this.activate(session);
        else this.logout();
      }
    } catch {
      this.logout();
    }
  }

  register(fullName: string, email: string, password: string) {
    return this.http.post<ApiUser>('/api/auth/register', {
      fullName: fullName.trim(), email: email.trim(), password,
    });
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email: email.trim(), password }).pipe(
      map(session => {
        if (!isActive(session)) throw new Error('Sesi dari server tidak valid.');
        this.activate(session);
        const role = roles[session.user.role];
        try {
          sessionStorage.setItem(sessionKey, JSON.stringify(session));
        } catch {
          return role;
        }
        return role;
      })
    );
  }

  accessToken(): string | null {
    const session = this.session();
    if (session && !isActive(session)) this.logout();
    return this.session()?.token ?? null;
  }

  logout(): void {
    clearTimeout(this.expiryTimer);
    this.session.set(null);
    try {
      sessionStorage.removeItem(sessionKey);
    } catch {
      return;
    }
  }

  private activate(session: LoginResponse): void {
    clearTimeout(this.expiryTimer);
    this.session.set(session);
    this.expiryTimer = setTimeout(() => this.logout(), Date.parse(session.expiresAt) - Date.now());
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/') || request.url.startsWith('/api/auth/')) return next(request);
  const token = inject(AuthService).accessToken();
  return next(token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request);
};
