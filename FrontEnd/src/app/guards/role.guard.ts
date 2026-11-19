import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CourseSystemService } from '../services/course-system.service';

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
