import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CourseSystemService } from '../services/course-system.service';

export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const svc = inject(CourseSystemService);
  return svc.currentUser() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const adminOnlyGuard: CanActivateFn = (_route, state) => {
  const svc = inject(CourseSystemService);
  const router = inject(Router);

  if (!svc.currentUser()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  if (svc.isAdmin()) {
    return true;
  }

  if (svc.isInstructor()) {
    return router.createUrlTree(['/teaching-schedule']);
  }

  svc.showNotification(
    'warning',
    'Akses Ditolak',
    'Halaman Pengelolaan hanya dapat diakses oleh Admin.'
  );
  return router.createUrlTree(['/courses']);
};

export const instructorScheduleGuard: CanActivateFn = (_route, state) => {
  const svc = inject(CourseSystemService);
  const router = inject(Router);

  if (!svc.currentUser()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

  if (svc.isInstructor()) {
    return true;
  }

  if (svc.isAdmin()) {
    return router.createUrlTree(['/instructors']);
  }

  svc.showNotification(
    'warning',
    'Akses Ditolak',
    'Jadwal mengajar hanya tersedia untuk akun pengajar.'
  );
  return router.createUrlTree(['/courses']);
};
