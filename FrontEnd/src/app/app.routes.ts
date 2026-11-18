import { Routes } from '@angular/router';
import { adminOnlyGuard, instructorScheduleGuard } from './guards/role.guard';
import { AdminBatchesComponent } from './pages/admin-batches/admin-batches.component';
import { AdminCoursesComponent } from './pages/admin-courses/admin-courses.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { BusinessSimulatorArchPageComponent } from './pages/business-simulator-arch/business-simulator-arch.component';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { CheckoutPaymentPageComponent } from './pages/checkout-payment/checkout-payment.component';
import { CourseDetailCheckoutComponent } from './pages/course-detail-checkout/course-detail-checkout.component';
import { InstructorsPageComponent } from './pages/instructors-page/instructors-page.component';
import { MyRegistrationsComponent } from './pages/my-registrations/my-registrations.component';
import { PaymentDetailPageComponent } from './pages/payment-detail/payment-detail.component';
import { ProfileAuthPageComponent } from './pages/profile-auth-page/profile-auth-page.component';
import { TeachingScheduleComponent } from './pages/teaching-schedule/teaching-schedule.component';

export const routes: Routes = [
  { path: '', redirectTo: 'courses', pathMatch: 'full' },

  // ==========================================================================
  // 1. ADMIN PAGES (Dashboard, Courses, Batches, Instructors)
  // ==========================================================================
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [adminOnlyGuard],
  },
  {
    path: 'admin/courses',
    component: AdminCoursesComponent,
    canActivate: [adminOnlyGuard],
  },
  {
    path: 'admin/batches',
    component: AdminBatchesComponent,
    canActivate: [adminOnlyGuard],
  },
  {
    path: 'admin/instructors',
    component: InstructorsPageComponent,
    canActivate: [adminOnlyGuard],
  },
  {
    path: 'instructors',
    redirectTo: 'admin/instructors',
    pathMatch: 'full',
  },

  // ==========================================================================
  // 2. STUDENT PAGES (Course Catalog, Course Detail, Checkout/Payment,
  //    My Registrations, Payment Detail, Profil + Ringkasan Aktivitas, Register/Login)
  // ==========================================================================
  { path: 'courses', component: CatalogPageComponent },
  { path: 'courses/:id', component: CourseDetailCheckoutComponent },
  { path: 'checkout/:batchId', component: CheckoutPaymentPageComponent },
  { path: 'my-registrations', component: MyRegistrationsComponent },
  { path: 'payments/:registrationId', component: PaymentDetailPageComponent },
  { path: 'simulator', component: BusinessSimulatorArchPageComponent },
  { path: 'profile', component: ProfileAuthPageComponent },
  { path: 'auth', redirectTo: 'profile', pathMatch: 'full' },
  { path: 'student/dashboard', redirectTo: 'profile', pathMatch: 'full' },

  // ==========================================================================
  // 3. INSTRUCTOR PAGE (My Teaching Schedule)
  // ==========================================================================
  {
    path: 'teaching-schedule',
    component: TeachingScheduleComponent,
    canActivate: [instructorScheduleGuard],
  },

  { path: '**', redirectTo: 'courses' },
];
