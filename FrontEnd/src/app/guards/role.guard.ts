import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CourseSystemService } from '../services/course-system.service';

/**
 * Guard untuk halaman Pengelolaan Admin (/instructors).
 * Sesuai Bab 1.1 & Bab 10: Hanya Admin yang dapat mengelola Instructor, Batch, dan Penugasan.
 */
export const adminOnlyGuard: CanActivateFn = () => {
  const svc = inject(CourseSystemService);
  const router = inject(Router);

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

/**
 * Guard untuk halaman My Teaching Schedule (/teaching-schedule).
 * Sesuai Bab 1.3 & Bab 10: Setelah login, Instructor diarahkan ke halaman My Teaching Schedule
 * dan hanya melihat jadwal batch miliknya sendiri.
 */
export const instructorScheduleGuard: CanActivateFn = () => {
  const svc = inject(CourseSystemService);
  const router = inject(Router);

  if (svc.isInstructor()) {
    return true;
  }

  if (svc.isAdmin()) {
    return router.createUrlTree(['/instructors']);
  }

  svc.showNotification(
    'warning',
    'Akses Ditolak',
    'Halaman My Teaching Schedule khusus untuk akun Instructor.'
  );
  return router.createUrlTree(['/courses']);
};
