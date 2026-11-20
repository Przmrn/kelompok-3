import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, firstValueFrom, forkJoin, of, tap } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BackendApiService, StudentProfileFields } from './backend-api.service';
import { AuthService } from './auth.service';
import {
  BatchInstructor,
  Course,
  CourseBatch,
  CourseCategory,
  EarlyBirdTierName,
  InstallmentSchedule,
  Instructor,
  Location,
  PaymentMethodType,
  PriceCalculationBreakdown,
  RefundCalculationResult,
  Registration,
  Student,
  User,
} from '../models/course-system.models';

@Injectable({
  providedIn: 'root',
})
export class CourseSystemService {
  readonly notification = signal<{
    type: 'success' | 'warning' | 'danger' | 'info';
    title: string;
    message: string;
  } | null>(null);

  private readonly auth = inject(AuthService);

  private readonly api = inject(BackendApiService);
  private readonly profileResult = signal<{
    owner: User;
    status: 'ready' | 'missing' | 'error';
    student?: Student;
  } | null>(null);
  private readonly profileAttempt = signal(0);
  private readonly savingFor = signal<User | null>(null);
  readonly savingProfile = computed(() => !!this.savingFor() && this.savingFor() === this.auth.user());
  readonly profileStatus = computed(() => {
    const result = this.profileResult();
    return result && result.owner === this.auth.user() ? result.status : 'loading';
  });

  readonly profileChecked = computed(() => this.profileStatus() === 'ready' || this.profileStatus() === 'missing');

  readonly categories = signal<CourseCategory[]>([]);
  readonly locations = signal<Location[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly batches = signal<CourseBatch[]>([]);
  readonly batchInstructors = signal<BatchInstructor[]>([]);
  private readonly publicInstructors = signal<Instructor[]>([]);
  private readonly accountData = signal<{
    userId: number; students: Student[]; registrations: Registration[];
    schedules: InstallmentSchedule[]; instructors: Instructor[];
  } | null>(null);
  private readonly account = computed(() => {
    const data = this.accountData();
    return data?.userId === this.auth.user()?.id ? data : null;
  });
  readonly students = computed(() => this.account()?.students ?? []);
  readonly registrations = computed(() => this.account()?.registrations ?? []);
  readonly myRegistrations = computed(() => this.isStudent() ? this.registrations() : []);
  readonly installmentSchedules = computed(() => this.account()?.schedules ?? []);
  readonly instructors = computed(() => this.isAdmin() ? this.account()?.instructors ?? [] : this.publicInstructors());
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly accountLoading = signal(false);
  readonly accountError = signal('');
  readonly saving = signal(false);
  private revision = 0;

  async reload(): Promise<void> {
    const revision = ++this.revision;
    const user = this.auth.user();
    const admin = user?.role === 'Admin';
    const participant = admin || user?.role === 'Student';
    this.loading.set(true);
    this.loadError.set('');
    this.accountLoading.set(participant);
    this.accountError.set('');
    if (!user) this.accountData.set(null);
    const currentAccount = () => revision === this.revision && user?.id === this.auth.user()?.id;
    await firstValueFrom(forkJoin({
      catalog: this.api.catalog().pipe(
        tap(catalog => {
          if (revision !== this.revision) return;
          this.categories.set(catalog.categories);
          this.locations.set(catalog.locations);
          this.courses.set(catalog.courses);
          this.batches.set(catalog.batches);
          this.batchInstructors.set(catalog.assignments);
          const profiles = catalog.assignments.map(a => ({ ...a.instructor, email: '', phoneNumber: '' }));
          this.publicInstructors.set([...new Map(profiles.map(i => [i.id, i])).values()]);
        }),
        catchError(error => {
          if (revision === this.revision) this.loadError.set(this.errorMessage(error));
          return of(null);
        }),
        finalize(() => { if (revision === this.revision) this.loading.set(false); })
      ),
      account: forkJoin({
        students: participant ? this.api.students(admin) : of([]),
        payments: participant ? this.api.registrations(admin) : of({ registrations: [], schedules: [] }),
        instructors: admin ? this.api.instructors() : of([]),
      }).pipe(
        tap(data => {
          if (currentAccount() && user) this.accountData.set({ userId: user.id, students: data.students, ...data.payments, instructors: data.instructors });
        }),
        catchError(error => {
          if (currentAccount()) this.accountError.set(this.errorMessage(error));
          return of(null);
        }),
        finalize(() => { if (revision === this.revision) this.accountLoading.set(false); })
      ),
    }));
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0 || error.status === 502 || error.status === 504) return 'Server belum dapat dihubungi.';
      if (error.status === 403) return 'Akun Anda tidak memiliki akses untuk tindakan ini.';
      if (error.status === 401) return 'Server belum dapat memverifikasi akun Anda.';
      if (typeof error.error?.message === 'string') return error.error.message;
      if (error.status === 400) return 'Periksa kembali isian formulir.';
    }
    return 'Permintaan belum berhasil. Silakan coba lagi.';
  }

  private async change(request: Observable<unknown>, message: string) {
    if (this.saving()) return { success: false, message: 'Permintaan masih diproses.' };
    const userId = this.auth.user()?.id;
    this.saving.set(true);
    try {
      await firstValueFrom(request);
      if (userId !== this.auth.user()?.id) return { success: false, message: 'Akun sudah berganti.' };
      await this.reload();
      if (userId !== this.auth.user()?.id) return { success: false, message: 'Akun sudah berganti.' };
      this.showNotification('success', 'Berhasil', message);
      return { success: true, message };
    } catch (error) {
      const message = this.errorMessage(error);
      this.showNotification('warning', 'Permintaan belum berhasil', message);
      return { success: false, message };
    } finally {
      this.saving.set(false);
    }
  }
  readonly authModalOpen = signal<boolean>(false);
  readonly authModalMode = signal<'LOGIN' | 'REGISTER'>('LOGIN');

  readonly currentUser = computed<User | null>(() => {
    const user = this.auth.user();
    if (user?.role !== 'Student') return user;
    const profile = this.getStudentByUserId(user.id);
    return profile ? { ...user, fullName: profile.fullName } : user;
  });

  readonly currentStudentProfile = computed<Student | null>(() => {
    const u = this.currentUser();
    if (!u || u.role !== 'Student') return null;
    return this.getStudentByUserId(u.id) ?? null;
  });

  readonly isAdmin = computed<boolean>(() => this.currentUser()?.role === 'Admin');
  readonly isInstructor = computed<boolean>(() => this.currentUser()?.role === 'Instructor');
  readonly isStudent = computed<boolean>(() => this.currentUser()?.role === 'Student');

  constructor() {
    effect(onCleanup => {
      const user = this.auth.user();
      this.profileAttempt();
      this.profileResult.set(null);
      if (user?.role !== 'Student') return;
      const request = this.api.getMyProfile().subscribe({
        next: student => this.profileResult.set(student.userId === user.id
          ? { owner: user, status: 'ready', student }
          : { owner: user, status: 'error' }),
        error: (error: HttpErrorResponse) => this.profileResult.set({
          owner: user, status: error.status === 404 ? 'missing' : 'error',
        }),
      });
      onCleanup(() => request.unsubscribe());
    }, { allowSignalWrites: true });
  }

  retryProfile(): void {
    this.profileAttempt.update(attempt => attempt + 1);
  }

  showNotification(
    type: 'success' | 'warning' | 'danger' | 'info',
    title: string,
    message: string
  ): void {
    this.notification.set({ type, title, message });
    setTimeout(() => {
      if (this.notification()?.title === title) {
        this.notification.set(null);
      }
    }, 5000);
  }

  dismissNotification(): void {
    this.notification.set(null);
  }

  openAuthModal(mode: 'LOGIN' | 'REGISTER' = 'LOGIN'): void {
    this.authModalMode.set(mode);
    this.authModalOpen.set(true);
  }

  closeAuthModal(): void {
    this.authModalOpen.set(false);
  }

  logoutUser(): void {
    this.auth.logout();
    this.showNotification(
      'info',
      'Anda sudah keluar',
      'Pilih Masuk untuk menggunakan akun Anda kembali.'
    );
  }

  getCategoryById(categoryId: number): CourseCategory | undefined {
    return this.categories().find((c) => c.id === categoryId);
  }

  getCourseById(courseId: number): Course | undefined {
    return this.courses().find((c) => c.id === courseId);
  }

  getBatchById(batchId: number): CourseBatch | undefined {
    return this.batches().find((b) => b.id === batchId);
  }

  getBatchesByCourseId(courseId: number): CourseBatch[] {
    return this.batches().filter((b) => b.courseId === courseId);
  }

  getLocationById(locationId: number): Location | undefined {
    return this.locations().find((l) => l.id === locationId);
  }

  getStudentById(studentId: number): Student | undefined {
    const current = this.currentStudentProfile();
    return current?.id === studentId ? current : this.students().find(s => s.id === studentId);
  }

  getStudentByUserId(userId: number): Student | undefined {
    const result = this.profileResult();
    if (result?.owner === this.auth.user() && result?.student?.userId === userId) return result.student;
    return this.students().find(student => student.userId === userId);
  }

  isStudentProfileComplete(userId: number): boolean {
    const s = this.getStudentByUserId(userId);
    if (!s) return false;
    return Boolean(
      s.fullName.trim() &&
        s.phoneNumber.trim() &&
        s.address.trim() &&
        s.city.trim() &&
        s.province.trim() &&
        s.country.trim() &&
        s.educationLevel.trim() &&
        s.occupation.trim()
    );
  }

  getUsedSeatsForBatch(batchId: number): number {
    return this.getBatchById(batchId)?.usedSeats ?? 0;
  }

  getRemainingSeatsForBatch(batchId: number): number {
    const b = this.getBatchById(batchId);
    if (!b) return 0;
    return Math.max(0, b.maxSeats - this.getUsedSeatsForBatch(batchId));
  }

  getNextQueueNumberForBatch(batchId: number): number {
    return this.getBatchById(batchId)?.nextQueue ?? 1;
  }

  getTierNameFromQueue(queueNumber: number): EarlyBirdTierName {
    if (queueNumber >= 1 && queueNumber <= 3) return 'Tier 1';
    if (queueNumber >= 4 && queueNumber <= 7) return 'Tier 2';
    return 'Reguler';
  }

  getTotalPaidForRegistration(reg: Registration): number {
    return reg.paidAmount;
  }

  getRemainingObligationForRegistration(reg: Registration): number {
    if (reg.registrationStatus === 'Cancelled') return 0;
    return Math.max(0, reg.totalAmount - this.getTotalPaidForRegistration(reg));
  }

readonly unpaidCartRegistrations = computed(() => this.myRegistrations().filter(reg =>
  reg.registrationStatus !== 'Cancelled' &&
  (reg.paymentStatus === 'Pending' || (reg.paymentStatus === 'Overdue' && reg.paidAmount === 0))
));

readonly purchasedCourses = computed(() => this.myRegistrations().filter(reg =>
  reg.paidAmount > 0 || reg.registrationStatus === 'Confirmed' || reg.registrationStatus === 'Completed'
));

  getSyllabusList(syllabusText: string): string[] {
    return syllabusText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  getInitials(fullName: string): string {
    const parts = fullName.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    return ((parts[0]?.charAt(0) ?? 'I') + (parts[1]?.charAt(0) ?? 'N')).toUpperCase();
  }

  getInstructorsForBatch(batchId: number): {
    instructor: Instructor;
    assignment: BatchInstructor;
  }[] {
    const assignments = this.batchInstructors().filter((bi) => bi.batchId === batchId);
    return assignments
      .map((assignment) => {
        const instructor = this.instructors().find((i) => i.id === assignment.instructorId);
        return instructor ? { instructor, assignment } : null;
      })
      .filter((item): item is { instructor: Instructor; assignment: BatchInstructor } => item !== null);
  }

  getBatchesForInstructor(instructorId: number): {
    batch: CourseBatch;
    course: Course;
    location: Location;
    assignment: BatchInstructor;
  }[] {
    const assignments = this.batchInstructors().filter((bi) => bi.instructorId === instructorId);
    return assignments
      .map((assignment) => {
        const batch = this.getBatchById(assignment.batchId);
        if (!batch) return null;
        const course = this.getCourseById(batch.courseId);
        const location = this.getLocationById(batch.locationId);
        if (!course || !location) return null;
        return { batch, course, location, assignment };
      })
      .filter(
        (
          item
        ): item is {
          batch: CourseBatch;
          course: Course;
          location: Location;
          assignment: BatchInstructor;
        } => item !== null
      );
  }

  getLoggedInInstructorProfile(): Instructor | null {
    const user = this.currentUser();
    if (!user || user.role !== 'Instructor') return null;
    return (
      this.instructors().find(
        (i) => i.userId === user.id
      ) ?? null
    );
  }


  calculatePriceBreakdown(
    basePrice: number,
    queueNumber: number
  ): PriceCalculationBreakdown {
    let discountTier: EarlyBirdTierName = 'Reguler';
    let discountPercentage = 0;
    let discountCap: number | null = null;

    if (queueNumber >= 1 && queueNumber <= 3) {
      discountTier = 'Tier 1';
      discountPercentage = 10;
      discountCap = 150000;
    } else if (queueNumber >= 4 && queueNumber <= 7) {
      discountTier = 'Tier 2';
      discountPercentage = 5;
      discountCap = 75000;
    }

    const rawDiscountAmount = (basePrice * discountPercentage) / 100;
    const earlyBirdDiscount =
      discountCap !== null ? Math.min(rawDiscountAmount, discountCap) : rawDiscountAmount;

    const priceAfterDiscount = basePrice - earlyBirdDiscount;
    const taxRate = 11.0;
    const taxAmount = Math.round(priceAfterDiscount * taxRate) / 100;
    const totalAmount = priceAfterDiscount + taxAmount;

    const tenors: (3 | 6 | 12)[] = [3, 6, 12];
    const installmentPreviews = tenors.map((tenorMonths) => {
      const regularMonthlyAmount = Math.ceil(totalAmount / tenorMonths / 1000) * 1000;
      const finalMonthAmount = totalAmount - regularMonthlyAmount * (tenorMonths - 1);

      const schedules = Array.from({ length: tenorMonths }, (_, idx) => {
        const installmentNumber = idx + 1;
        const isLast = installmentNumber === tenorMonths;
        return {
          installmentNumber,
          dueDate: this.getArrearDueDateString(installmentNumber),
          amount: isLast ? finalMonthAmount : regularMonthlyAmount,
        };
      });

      return {
        tenorMonths,
        regularMonthlyAmount,
        finalMonthAmount,
        schedules,
      };
    });

    return {
      queueNumber,
      basePrice,
      discountTier,
      discountPercentage,
      discountCap,
      rawDiscountAmount,
      earlyBirdDiscount,
      priceAfterDiscount,
      taxRate,
      taxAmount,
      totalAmount,
      installmentPreviews,
    };
  }

  private getArrearDueDateString(monthOffset: number): string {
    const today = new Date();
    const last = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + monthOffset + 1, 0));
    last.setUTCDate(Math.min(today.getUTCDate(), last.getUTCDate()));
    return last.toISOString().slice(0, 10);
  }


  hasActiveRegistrationInBatch(studentId: number, batchId: number): boolean {
    return this.registrations().some(
      (r) =>
        r.studentId === studentId && r.batchId === batchId &&
        r.registrationStatus !== 'Cancelled'
    );
  }

  calculateRefundPreview(
    registration: Registration,
    simulatedCancellationDateStr?: string
  ): RefundCalculationResult {
    const batch = this.getBatchById(registration.batchId);
    const batchStartStr = batch?.startDate ?? '2026-12-12';
    const cancelDateStr =
      simulatedCancellationDateStr ?? new Date().toISOString().slice(0, 10);

    const startMs = new Date(`${batchStartStr}T00:00:00`).getTime();
    const cancelMs = new Date(`${cancelDateStr}T00:00:00`).getTime();
    const daysDifference = Math.floor((startMs - cancelMs) / (1000 * 60 * 60 * 24));
    const totalPaid = this.getTotalPaidForRegistration(registration);

    if (registration.registrationStatus === 'Cancelled') {
      return {
        batchStartDate: batchStartStr,
        cancellationDate: cancelDateStr,
        daysDifference,
        totalPaid,
        tierLabel: 'Sudah Dibatalkan',
        refundPercentage: 0,
        floorAdminFee: 0,
        estimatedRefundAmount: 0,
        canCancel: false,
        reasonIfBlocked: 'Pendaftaran ini sudah dibatalkan.',
      };
    }

    if (daysDifference <= 0) {
      return {
        batchStartDate: batchStartStr,
        cancellationDate: cancelDateStr,
        daysDifference,
        totalPaid,
        tierLabel: 'Kelas Sudah Dimulai',
        refundPercentage: 0,
        floorAdminFee: 0,
        estimatedRefundAmount: 0,
        canCancel: false,
        reasonIfBlocked: 'Pembatalan hanya dapat diajukan selama kelas belum dimulai.',
      };
    }

    let tierLabel = '';
    let refundPercentage = 0;
    let floorAdminFee = 0;
    let estimatedRefundAmount = 0;

    if (daysDifference >= 14) {
      tierLabel = '14 hari atau lebih (seluruh pembayaran dikurangi biaya administrasi Rp25.000)';
      refundPercentage = 100;
      floorAdminFee = 25000;
      estimatedRefundAmount = Math.max(0, totalPaid - floorAdminFee);
    } else if (daysDifference >= 7 && daysDifference <= 13) {
      tierLabel = '7–13 hari (50% dari jumlah yang sudah dibayar)';
      refundPercentage = 50;
      floorAdminFee = 0;
      estimatedRefundAmount = Math.round(totalPaid * 0.5);
    } else if (daysDifference >= 3 && daysDifference <= 6) {
      tierLabel = '3–6 hari (25% dari jumlah yang sudah dibayar)';
      refundPercentage = 25;
      floorAdminFee = 0;
      estimatedRefundAmount = Math.round(totalPaid * 0.25);
    } else {
      tierLabel = 'Kurang dari 3 hari (0% / dana hangus)';
      refundPercentage = 0;
      floorAdminFee = 0;
      estimatedRefundAmount = 0;
    }

    return {
      batchStartDate: batchStartStr,
      cancellationDate: cancelDateStr,
      daysDifference,
      totalPaid,
      tierLabel,
      refundPercentage,
      floorAdminFee,
      estimatedRefundAmount,
      canCancel: true,
    };
  }


async updateStudentProfile(profile: StudentProfileFields): Promise<void> {
    const user = this.auth.user();
    const status = this.profileStatus();
    if (!user || this.savingProfile() || (status !== 'ready' && status !== 'missing')) return;
    this.savingFor.set(user);
    try {
      const student = await firstValueFrom(this.api.saveMyProfile(profile, status === 'ready'));
      if (this.auth.user() !== user) return;
      if (student.userId !== user.id) throw new Error();
      this.profileResult.set({ owner: user, status: 'ready', student });
      const complete = this.isStudentProfileComplete(user.id);
      this.showNotification('success', 'Profil tersimpan', complete
        ? 'Profil Anda lengkap. Anda sudah bisa mendaftar kelas.'
        : 'Lengkapi kolom yang masih kosong sebelum mendaftar kelas.');
    } catch (error) {
      if (this.auth.user() !== user) return;
      if (error instanceof HttpErrorResponse && error.status === 409 && status === 'missing') {
        this.retryProfile();
        this.showNotification('info', 'Profil sudah ada', 'Profil yang tersimpan sedang dimuat kembali.');
      } else {
        this.showNotification('danger', 'Profil belum tersimpan', 'Periksa isian dan koneksi Anda, lalu coba simpan kembali.');
      }
    } finally {
      if (this.savingFor() === user) this.savingFor.set(null);
    }
  }

  submitCourseRegistration(batchId: number, method: PaymentMethodType, tenor: number | null) {
    return this.change(this.api.createRegistration(batchId, method, tenor), 'Pendaftaran Anda sudah tersimpan.');
  }

  confirmCancelRegistration(id: number) {
    return this.change(this.api.cancelRegistration(id), 'Pendaftaran dibatalkan.');
  }

  confirmUpfrontPayment(id: number) {
    return this.change(this.api.confirmUpfront(id), 'Pembayaran dikonfirmasi.');
  }

  payInstallmentSchedule(id: number, paidAmount?: number) {
    return this.change(this.api.confirmInstallment(id, paidAmount), 'Pembayaran cicilan dikonfirmasi.');
  }

  processOverdue() {
    return this.change(this.api.processOverdue(), 'Status tagihan telah diperiksa.');
  }

  assignInstructorToBatch(payload: { batchId: number; instructorId: number }) {
    return this.change(this.api.assignment(payload.batchId, payload.instructorId, false), 'Pengajar ditugaskan.');
  }

  removeInstructorAssignment(assignment: BatchInstructor) {
    return this.change(this.api.assignment(assignment.batchId, assignment.instructorId, true), 'Penugasan dihapus.');
  }

  saveInstructor(id: number | undefined, payload: Omit<Instructor, 'id' | 'userId'> & { password?: string }) {
    return this.change(this.api.save('instructors', id, payload), 'Profil pengajar disimpan.');
  }

  deleteInstructorByAdmin(id: number) { return this.change(this.api.remove('instructors', id), 'Pengajar dihapus.'); }

  saveCourseByAdmin({ id, categoryId, syllabus, durationHours, basePrice }: Omit<Course, 'id' | 'title' | 'description'> & { id?: number }) {
    return this.change(this.api.save('courses', id, { categoryId, syllabus, durationHours, basePrice }), 'Kelas disimpan.');
  }

  deleteCourseByAdmin(id: number) { return this.change(this.api.remove('courses', id), 'Kelas dihapus.'); }

  saveBatchByAdmin({ id, startTime, endTime, ...fields }: Omit<CourseBatch, 'id' | 'nextQueue' | 'usedSeats' | 'status'> & { id?: number }) {
    return this.change(this.api.save('CourseBatch', id, { ...fields, startTime: startTime.slice(0, 5) + ':00', endTime: endTime.slice(0, 5) + ':00' }), 'Jadwal kelas disimpan.');
  }

  deleteBatchByAdmin(id: number) { return this.change(this.api.remove('CourseBatch', id), 'Jadwal kelas dihapus.'); }

  saveCategory(id: number | undefined, data: Omit<CourseCategory, 'id'>) {
    return this.change(this.api.save('course-categories', id, data), 'Kategori disimpan.');
  }

  saveLocation(id: number | undefined, data: Omit<Location, 'id'>) {
    return this.change(this.api.save('locations', id, data), 'Lokasi disimpan.');
  }

  removeReference(resource: 'locations' | 'course-categories', id: number) {
    return this.change(this.api.remove(resource, id), 'Data dihapus.');
  }

}
