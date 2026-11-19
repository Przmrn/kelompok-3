import { Injectable, computed, inject, signal } from '@angular/core';
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
  readonly students = signal<Student[]>([
    {
      id: 1,
      userId: -1,
      fullName: 'Raka Pratama Wijaya',
      phoneNumber: '081288901122',
      address: 'Jl. Kemang Raya No. 42A, Mampang Prapatan',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      educationLevel: 'S1 Teknik Informatika',
      occupation: 'Junior Software Engineer',
    },
    {
      id: 2,
      userId: -2,
      fullName: 'Nadia Larasati Putri',
      phoneNumber: '085711223344',
      address: '',
      city: '',
      province: '',
      country: '',
      educationLevel: '',
      occupation: '',
    },
  ]);

  readonly authModalOpen = signal<boolean>(false);
  readonly authModalMode = signal<'LOGIN' | 'REGISTER'>('LOGIN');

  readonly currentUser = computed<User | null>(() => {
    const user = this.auth.user();
    if (user?.role !== 'Student') return user;
    const profile = this.students().find(student => student.userId === user.id);
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

  readonly categories = signal<CourseCategory[]>([
    {
      id: 1,
      name: 'Backend Engineering',
      description: 'Arsitektur API, Database Relasional, dan Microservices.',
    },
    {
      id: 2,
      name: 'Frontend Architecture',
      description: 'Modern Web App dengan Angular dan State Management.',
    },
    {
      id: 3,
      name: 'Data Science & AI',
      description: 'Machine Learning Terapan dan Statistical Modeling.',
    },
    {
      id: 4,
      name: 'Product UI/UX',
      description: 'Riset Pengguna, Design System, dan Prototyping.',
    },
  ]);

  readonly locations = signal<Location[]>([
    {
      id: 1,
      name: 'Kampus Karsa Kemang Studio',
      address: 'Jl. Kemang Timur No. 88, Pasar Minggu',
      city: 'Jakarta Selatan',
      roomName: 'Lab Rekayasa 302',
    },
    {
      id: 2,
      name: 'Menara Karya Sudirman Hub',
      address: 'Jl. Jend. Sudirman Kav. 52-53, Senayan',
      city: 'Jakarta Pusat',
      roomName: 'Auditorium Praktikum B-104',
    },
    {
      id: 3,
      name: 'Lokakarya Dago Creative Space',
      address: 'Jl. Ir. H. Juanda No. 145, Coblong',
      city: 'Bandung',
      roomName: 'Studio Desain A-201',
    },
  ]);

  readonly courses = signal<Course[]>([
    {
      id: 1,
      categoryId: 1,
      title: 'Backend Development & Distributed Systems',
      description:
        'Kursus intensif tatap muka untuk menguasai rekayasa Backend menggunakan ASP.NET Core dan SQL Server/PostgreSQL. Membahas desain 10 tabel relasional, transaksi database ACID, dan Service Layer.',
      syllabus:
        '1. Pemodelan Database Relasional 10 Tabel & Unique Constraint\n2. ASP.NET Core Service Layer & Transaksi pemesanan kursi\n3. Keamanan kata sandi dan hak akses pengguna\n4. Pengujian API, Perhitungan Pajak 11% & Jadwal cicilan akhir bulan',
      durationHours: 48,
      basePrice: 1000000,
    },
    {
      id: 2,
      categoryId: 2,
      title: 'Enterprise Frontend Engineering with Angular',
      description:
        'Workshop langsung di laboratorium untuk membangun aplikasi web modern dengan Angular. Fokus pada Standalone Components, Signals, Route Guards, dan integrasi REST API.',
      syllabus:
        '1. Standalone Components & Reactive Signals\n2. Routing, Role Guards (Admin/Student/Instructor) & Checkout Form\n3. UI Architecture dengan Bootstrap 5 & Integrasi Endpoint Backend',
      durationHours: 42,
      basePrice: 1650000,
    },
    {
      id: 3,
      categoryId: 3,
      title: 'Applied Data Science & Predictive Analytics',
      description:
        'Pelatihan tatap muka intensif yang menjembatani teori statistik dengan kebutuhan bisnis riil. Peserta mengolah dataset transaksi dan membangun model prediktif.',
      syllabus:
        '1. Exploratory Data Analysis & SQL Queries\n2. Supervised Learning & Feature Engineering\n3. Model Evaluation & Business Reporting',
      durationHours: 54,
      basePrice: 2000000,
    },
    {
      id: 4,
      categoryId: 4,
      title: 'Product Design System & Tactical UX Research',
      description:
        'Dalam kelas studio offline ini, peserta mempraktikkan riset pengguna, merancang alur pendaftaran dan pembayaran yang intuitif, serta membangun komponen sistem desain.',
      syllabus:
        '1. User Research & Information Architecture\n2. Wireframing & Interactive Prototyping\n3. Design System Tokens & Developer Handoff',
      durationHours: 36,
      basePrice: 1250000,
    },
  ]);

  readonly batches = signal<CourseBatch[]>([
    {
      id: 1,
      courseId: 1,
      locationId: 1,
      batchName: 'BCH-BE-01 — Batch 1 Reguler Kemang',
      startDate: '2026-12-01',
      endDate: '2026-12-22',
      startTime: '09:00',
      endTime: '16:00',
      maxSeats: 30,
      status: 'Full',
    },
    {
      id: 2,
      courseId: 1,
      locationId: 1,
      batchName: 'BCH-BE-02 — Batch 2 Intensif Desember',
      startDate: '2026-12-12',
      endDate: '2027-01-10',
      startTime: '09:00',
      endTime: '16:00',
      maxSeats: 30,
      status: 'Open',
    },
    {
      id: 3,
      courseId: 1,
      locationId: 2,
      batchName: 'BCH-BE-03 — Batch 3 Kelas Malam Sudirman',
      startDate: '2026-12-15',
      endDate: '2027-01-14',
      startTime: '18:30',
      endTime: '21:30',
      maxSeats: 30,
      status: 'Open',
    },
    {
      id: 4,
      courseId: 2,
      locationId: 2,
      batchName: 'BCH-FE-01 — Batch 1 Sudirman Studio',
      startDate: '2026-12-05',
      endDate: '2026-12-27',
      startTime: '09:00',
      endTime: '16:00',
      maxSeats: 30,
      status: 'Open',
    },
    {
      id: 5,
      courseId: 2,
      locationId: 3,
      batchName: 'BCH-FE-02 — Batch 2 Bandung Bootcamp',
      startDate: '2026-12-14',
      endDate: '2027-01-11',
      startTime: '09:00',
      endTime: '16:00',
      maxSeats: 30,
      status: 'Open',
    },
    {
      id: 6,
      courseId: 3,
      locationId: 1,
      batchName: 'BCH-DS-01 — Batch 1 Kemang Data Lab',
      startDate: '2026-12-10',
      endDate: '2027-01-15',
      startTime: '18:30',
      endTime: '21:30',
      maxSeats: 30,
      status: 'Open',
    },
    {
      id: 7,
      courseId: 4,
      locationId: 3,
      batchName: 'BCH-UX-01 — Batch 1 Dago Design Studio',
      startDate: '2026-12-06',
      endDate: '2026-12-21',
      startTime: '10:00',
      endTime: '17:00',
      maxSeats: 30,
      status: 'Open',
    },
  ]);

  private readonly batchSeatBaseline = signal<Record<number, { usedSeats: number; nextQueue: number }>>({
    1: { usedSeats: 30, nextQueue: 31 },
    2: { usedSeats: 18, nextQueue: 19 },
    3: { usedSeats: 1, nextQueue: 2 },
    4: { usedSeats: 4, nextQueue: 5 },
    5: { usedSeats: 2, nextQueue: 3 },
    6: { usedSeats: 0, nextQueue: 1 },
    7: { usedSeats: 5, nextQueue: 6 },
  });

  readonly instructors = signal<Instructor[]>([
    {
      id: 1,
      userId: 3,
      fullName: 'Ir. Bagas Adiwardhana, M.Kom.',
      expertise: 'ASP.NET Core, SQL Server, PostgreSQL, Distributed Systems',
      bio: 'Berpengalaman 11 tahun merancang sistem transaksi database berkapasitas tinggi dan arsitektur backend enterprise.',
      email: 'bagas.adi@karsa.id',
      phoneNumber: '08112345678',
    },
    {
      id: 2,
      userId: 4,
      fullName: 'Clara Sinta Maharani, S.T.',
      expertise: 'Angular Architecture, TypeScript, Web Performance',
      bio: 'Memimpin pengembangan platform frontend enterprise dengan fokus pada arsitektur modular dan aksesibilitas.',
      email: 'clara.maharani@karsa.id',
      phoneNumber: '081299887766',
    },
    {
      id: 3,
      userId: 103,
      fullName: 'Dr. Dimas Prayogo, M.Sc.',
      expertise: 'Statistical Modeling, Machine Learning, Python',
      bio: 'Doktor komputasi statistik yang berpengalaman menerapkan model prediktif di industri finansial dan ritel.',
      email: 'dimas.prayogo@karsa.id',
      phoneNumber: '081344556677',
    },
    {
      id: 4,
      userId: 104,
      fullName: 'Tariq Al-Faruq, B.Des.',
      expertise: 'UX Research, Design Systems, Prototyping',
      bio: 'Desainer produk dengan fokus pada penyederhanaan alur aplikasi finansial dan edukasi.',
      email: 'tariq.alfaruq@karsa.id',
      phoneNumber: '081577665544',
    },
  ]);

  readonly batchInstructors = signal<BatchInstructor[]>([
    { id: 1, batchId: 1, instructorId: 1 },
    { id: 2, batchId: 1, instructorId: 3 },
    { id: 3, batchId: 2, instructorId: 2 },
    { id: 4, batchId: 3, instructorId: 1 },
    { id: 5, batchId: 4, instructorId: 2 },
    { id: 6, batchId: 5, instructorId: 4 },
    { id: 7, batchId: 6, instructorId: 3 },
    { id: 8, batchId: 7, instructorId: 4 },
  ]);

  readonly registrations = signal<Registration[]>([
    {
      id: 1,
      studentId: 1,
      batchId: 2,
      registrationNumber: 'REG-202611-0001',
      registrationDate: '2026-11-10T10:30:00Z',
      queueNumber: 1,
      basePrice: 1000000,
      earlyBirdDiscount: 100000,
      taxRate: 11.0,
      taxAmount: 99000,
      totalAmount: 999000,
      paymentMethod: 'Installment',
      installmentTenor: 3,
      paymentStatus: 'PartiallyPaid',
      registrationStatus: 'Confirmed',
    },
    {
      id: 2,
      studentId: 1,
      batchId: 7,
      registrationNumber: 'REG-202611-0002',
      registrationDate: '2026-11-18T09:15:00Z',
      queueNumber: 5,
      basePrice: 1250000,
      earlyBirdDiscount: 62500,
      taxRate: 11.0,
      taxAmount: 130625,
      totalAmount: 1318125,
      paymentMethod: 'Upfront',
      installmentTenor: null,
      paymentStatus: 'Pending',
      registrationStatus: 'Pending',
    },
  ]);

  readonly installmentSchedules = signal<InstallmentSchedule[]>([
    {
      id: 1,
      registrationId: 1,
      installmentNumber: 1,
      dueDate: '2026-11-30',
      amount: 333000,
      paidAt: '2026-11-10T10:35:00Z',
      paidAmount: 333000,
      status: 'Paid',
    },
    {
      id: 2,
      registrationId: 1,
      installmentNumber: 2,
      dueDate: '2026-12-31',
      amount: 333000,
      paidAt: null,
      paidAmount: 0,
      status: 'Pending',
    },
    {
      id: 3,
      registrationId: 1,
      installmentNumber: 3,
      dueDate: '2027-01-31',
      amount: 333000,
      paidAt: null,
      paidAmount: 0,
      status: 'Pending',
    },
  ]);


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
    return this.students().find((s) => s.id === studentId);
  }

  getStudentByUserId(userId: number): Student | undefined {
    const saved = this.students().find(student => student.userId === userId);
    if (saved) return saved;
    const user = this.auth.user();
    if (user?.id !== userId || user.role !== 'Student') return undefined;
    return {
      id: -user.id, userId, fullName: user.fullName, phoneNumber: '', address: '',
      city: '', province: '', country: '', educationLevel: '', occupation: '',
    };
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
    return this.batchSeatBaseline()[batchId]?.usedSeats ?? 0;
  }

  getRemainingSeatsForBatch(batchId: number): number {
    const b = this.getBatchById(batchId);
    if (!b) return 0;
    return Math.max(0, b.maxSeats - this.getUsedSeatsForBatch(batchId));
  }

  getNextQueueNumberForBatch(batchId: number): number {
    return this.batchSeatBaseline()[batchId]?.nextQueue ?? 1;
  }

  getTierNameFromQueue(queueNumber: number): EarlyBirdTierName {
    if (queueNumber >= 1 && queueNumber <= 3) return 'Tier 1';
    if (queueNumber >= 4 && queueNumber <= 7) return 'Tier 2';
    return 'Reguler';
  }

  getTotalPaidForRegistration(reg: Registration): number {
    if (reg.paymentMethod === 'Upfront') {
      return reg.paymentStatus === 'Paid' ? reg.totalAmount : 0;
    }
    return this.installmentSchedules()
      .filter((s) => s.registrationId === reg.id && s.status === 'Paid')
      .reduce((acc, s) => acc + s.paidAmount, 0);
  }

  getRemainingObligationForRegistration(reg: Registration): number {
    if (reg.registrationStatus === 'Cancelled') return 0;
    return Math.max(0, reg.totalAmount - this.getTotalPaidForRegistration(reg));
  }

  getUnpaidCartRegistrations(studentId: number): Registration[] {
    return this.registrations().filter(
      (r) =>
        r.studentId === studentId &&
        r.registrationStatus !== 'Cancelled' &&
        r.paymentStatus === 'Pending'
    );
  }

  getPaidCoursesForStudent(studentId: number): Registration[] {
    return this.registrations().filter(
      (r) =>
        r.studentId === studentId &&
        (r.paymentStatus === 'Paid' ||
          r.paymentStatus === 'PartiallyPaid' ||
          r.registrationStatus === 'Confirmed' ||
          r.registrationStatus === 'Completed')
    );
  }

  payRegistrationFromCart(registrationId: number): void {
    const reg = this.registrations().find((r) => r.id === registrationId);
    if (!reg) return;

    if (reg.paymentMethod === 'Upfront') {
      this.confirmUpfrontPayment(reg.id);
    } else {
      const firstSchedule = this.installmentSchedules().find(
        (s) => s.registrationId === reg.id && s.installmentNumber === 1
      );
      if (firstSchedule) {
        this.payInstallmentSchedule(firstSchedule.id);
      }
    }
  }

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
        (i) => i.email.toLowerCase() === user.email.toLowerCase()
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

    const rawDiscountAmount = Math.round((basePrice * discountPercentage) / 100);
    const earlyBirdDiscount =
      discountCap !== null ? Math.min(rawDiscountAmount, discountCap) : rawDiscountAmount;

    const priceAfterDiscount = basePrice - earlyBirdDiscount;
    const taxRate = 11.0;
    const taxAmount = Math.round((priceAfterDiscount * taxRate) / 100);
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
    const base = new Date(2026, 10 + monthOffset, 0);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }


  updateStudentProfile(
    userId: number,
    profileData: {
      fullName: string;
      phoneNumber: string;
      address: string;
      city: string;
      province: string;
      country: string;
      educationLevel: string;
      occupation: string;
    }
  ): { success: boolean; message: string } {
    const student = this.getStudentByUserId(userId);
    if (!student || this.currentUser()?.id !== userId) {
      return { success: false, message: 'Silakan masuk untuk memperbarui profil.' };
    }
    const updated: Student = {
      ...student,
      fullName: profileData.fullName.trim(),
      phoneNumber: profileData.phoneNumber.trim(),
      address: profileData.address.trim(),
      city: profileData.city.trim(),
      province: profileData.province.trim(),
      country: profileData.country.trim(),
      educationLevel: profileData.educationLevel.trim(),
      occupation: profileData.occupation.trim(),
    };
    this.students.update(list => [...list.filter(s => s.userId !== userId), updated]);

    const complete = this.isStudentProfileComplete(userId);
    this.showNotification(
      complete ? 'success' : 'warning',
      complete ? 'Profil lengkap' : 'Profil Disimpan Sebagian',
      complete
        ? 'Profil Anda lengkap. Anda sudah bisa mendaftar kelas.'
        : 'Lengkapi kolom profil yang masih kosong sebelum mendaftar kelas.'
    );

    return {
      success: true,
      message: complete ? 'Profil lengkap!' : 'Profil disimpan sebagian.',
    };
  }


  hasActiveRegistrationInBatch(studentId: number, batchId: number): boolean {
    return this.registrations().some(
      (r) =>
        r.studentId === studentId &&
        r.batchId === batchId &&
        r.registrationStatus !== 'Cancelled'
    );
  }

  submitCourseRegistration(payload: {
    userId: number;
    batchId: number;
    paymentMethod: PaymentMethodType;
    installmentTenor: 3 | 6 | 12 | null;
    simulateInitialPaymentConfirmed: boolean;
  }): { success: boolean; message: string; registration?: Registration } {
    const user = this.currentUser();
    const student = this.getStudentByUserId(payload.userId);
    if (!user || user.id !== payload.userId || !student || user.role !== 'Student') {
      return {
        success: false,
        message: 'Gunakan akun peserta untuk mendaftar kelas.',
      };
    }

    if (!this.isStudentProfileComplete(user.id)) {
      return {
        success: false,
        message: 'Lengkapi profil Anda sebelum mendaftar kelas.',
      };
    }

    const batch = this.getBatchById(payload.batchId);
    if (!batch) {
      return { success: false, message: 'Jadwal kelas tidak ditemukan.' };
    }

    const course = this.getCourseById(batch.courseId);
    if (!course) {
      return { success: false, message: 'Kelas tidak ditemukan.' };
    }

    const usedSeats = this.getUsedSeatsForBatch(batch.id);
    if (usedSeats >= batch.maxSeats || batch.status === 'Full') {
      return {
        success: false,
        message: `Kursi untuk ${batch.batchName} sudah penuh. Pilih jadwal lain.`,
      };
    }

    if (this.hasActiveRegistrationInBatch(student.id, batch.id)) {
      return {
        success: false,
        message: 'Anda sudah terdaftar pada jadwal ini.',
      };
    }

    let validatedTenor: 3 | 6 | 12 | null = null;
    if (payload.paymentMethod === 'Installment') {
      if (
        payload.installmentTenor !== 3 &&
        payload.installmentTenor !== 6 &&
        payload.installmentTenor !== 12
      ) {
        return {
          success: false,
          message: 'Pilih lama cicilan 3, 6, atau 12 bulan.',
        };
      }
      validatedTenor = payload.installmentTenor;
    }

    const queueNo = this.getNextQueueNumberForBatch(batch.id);
    const calc = this.calculatePriceBreakdown(course.basePrice, queueNo);

    const regId = Date.now();
    const regNo = `REG-202611-${String(this.registrations().length + 2).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();

    let registrationStatus: Registration['registrationStatus'] = 'Pending';
    let paymentStatus: Registration['paymentStatus'] = 'Pending';
    let schedulesToCreate: InstallmentSchedule[] = [];

    if (payload.paymentMethod === 'Upfront') {
      const isPaid = payload.simulateInitialPaymentConfirmed;
      registrationStatus = isPaid ? 'Confirmed' : 'Pending';
      paymentStatus = isPaid ? 'Paid' : 'Pending';
    } else if (validatedTenor) {
      const preview =
        calc.installmentPreviews.find((p) => p.tenorMonths === validatedTenor) ??
        calc.installmentPreviews[0];

      const firstPaid = payload.simulateInitialPaymentConfirmed;
      registrationStatus = firstPaid ? 'Confirmed' : 'Pending';
      paymentStatus = firstPaid ? 'PartiallyPaid' : 'Pending';

      schedulesToCreate = preview.schedules.map((s, idx) => {
        const isFirstAndPaid = idx === 0 && firstPaid;
        return {
          id: Date.now() + idx + 1,
          registrationId: regId,
          installmentNumber: s.installmentNumber,
          dueDate: s.dueDate,
          amount: s.amount,
          paidAt: isFirstAndPaid ? nowIso : null,
          paidAmount: isFirstAndPaid ? s.amount : 0,
          status: isFirstAndPaid ? 'Paid' : 'Pending',
        };
      });
    }

    const newRegistration: Registration = {
      id: regId,
      studentId: student.id,
      batchId: batch.id,
      registrationNumber: regNo,
      registrationDate: nowIso,
      queueNumber: queueNo,
      basePrice: calc.basePrice,
      earlyBirdDiscount: calc.earlyBirdDiscount,
      taxRate: calc.taxRate,
      taxAmount: calc.taxAmount,
      totalAmount: calc.totalAmount,
      paymentMethod: payload.paymentMethod,
      installmentTenor: validatedTenor,
      paymentStatus,
      registrationStatus,
    };

    this.registrations.update((list) => [newRegistration, ...list]);
    if (schedulesToCreate.length > 0) {
      this.installmentSchedules.update((list) => [...schedulesToCreate, ...list]);
    }

    this.reserveSeatAndAdvanceQueue(batch.id);

    this.showNotification(
      'success',
      `Pendaftaran ${regNo} Berhasil`,
      `Anda pendaftar ke-${queueNo}. Total biaya kelas Rp${calc.totalAmount.toLocaleString('id-ID')}.`
    );

    return {
      success: true,
      message: 'Pendaftaran berhasil disimpan.',
      registration: newRegistration,
    };
  }

  private reserveSeatAndAdvanceQueue(batchId: number): void {
    const b = this.getBatchById(batchId);
    if (!b) return;
    const current = this.batchSeatBaseline()[batchId] ?? { usedSeats: 0, nextQueue: 1 };
    const newUsed = Math.min(b.maxSeats, current.usedSeats + 1);
    const newQueue = current.nextQueue + 1;

    this.batchSeatBaseline.update((prev) => ({
      ...prev,
      [batchId]: { usedSeats: newUsed, nextQueue: newQueue },
    }));

    this.batches.update((list) =>
      list.map((item) =>
        item.id === batchId
          ? { ...item, status: newUsed >= item.maxSeats ? 'Full' : 'Open' }
          : item
      )
    );
  }

  private releaseSeatWithoutReusingQueue(batchId: number): void {
    const b = this.getBatchById(batchId);
    if (!b) return;
    const current = this.batchSeatBaseline()[batchId] ?? { usedSeats: 0, nextQueue: 1 };
    const newUsed = Math.max(0, current.usedSeats - 1);

    this.batchSeatBaseline.update((prev) => ({
      ...prev,
      [batchId]: { usedSeats: newUsed, nextQueue: current.nextQueue },
    }));

    this.batches.update((list) =>
      list.map((item) =>
        item.id === batchId
          ? { ...item, status: newUsed >= item.maxSeats ? 'Full' : 'Open' }
          : item
      )
    );
  }

  confirmUpfrontPayment(registrationId: number): void {
    this.registrations.update((list) =>
      list.map((r) =>
        r.id === registrationId && r.paymentMethod === 'Upfront'
          ? {
              ...r,
              paymentStatus: 'Paid',
              registrationStatus:
                r.registrationStatus === 'Pending' ? 'Confirmed' : r.registrationStatus,
            }
          : r
      )
    );
    this.showNotification(
      'success',
      'Pembayaran berhasil',
      'Biaya kelas sudah lunas.'
    );
  }

  payInstallmentSchedule(scheduleId: number): void {
    const target = this.installmentSchedules().find((s) => s.id === scheduleId);
    if (!target || target.status === 'Paid') return;

    const nowIso = new Date().toISOString();

    this.installmentSchedules.update((list) =>
      list.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              paidAmount: s.amount,
              paidAt: nowIso,
              status: 'Paid',
            }
          : s
      )
    );

    const allForReg = this.installmentSchedules().filter(
      (s) => s.registrationId === target.registrationId
    );
    const allPaid = allForReg.every((s) => s.status === 'Paid');
    const anyPaid = allForReg.some((s) => s.status === 'Paid');

    this.registrations.update((list) =>
      list.map((r) =>
        r.id === target.registrationId
          ? {
              ...r,
              paymentStatus: allPaid ? 'Paid' : anyPaid ? 'PartiallyPaid' : 'Pending',
              registrationStatus:
                r.registrationStatus === 'Pending' && anyPaid ? 'Confirmed' : r.registrationStatus,
            }
          : r
      )
    );

    this.showNotification(
      'success',
      'Pembayaran berhasil',
      `Cicilan ke-${target.installmentNumber} sebesar Rp${target.amount.toLocaleString('id-ID')} sudah dibayar.`
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

  confirmCancelRegistration(
    registrationId: number,
    cancellationDateStr: string,
    reason: string
  ): { success: boolean; message: string } {
    const reg = this.registrations().find((r) => r.id === registrationId);
    if (!reg) {
      return { success: false, message: 'Data pendaftaran tidak ditemukan.' };
    }

    const preview = this.calculateRefundPreview(reg, cancellationDateStr);
    if (!preview.canCancel) {
      return {
        success: false,
        message: preview.reasonIfBlocked ?? 'Pendaftaran tidak dapat dibatalkan.',
      };
    }

    this.registrations.update((list) =>
      list.map((r) =>
        r.id === registrationId
          ? {
              ...r,
              registrationStatus: 'Cancelled',
              cancelledAt: cancellationDateStr,
              daysBeforeBatchStart: preview.daysDifference,
              refundPercentage: preview.refundPercentage,
              refundAmount: preview.estimatedRefundAmount,
              cancellationReason: reason.trim() || 'Dibatalkan oleh peserta',
            }
          : r
      )
    );

    this.releaseSeatWithoutReusingQueue(reg.batchId);

    this.showNotification(
      'warning',
      'Pendaftaran Dibatalkan',
      `Pendaftaran Anda dibatalkan. Pengembalian dana Rp${preview.estimatedRefundAmount.toLocaleString('id-ID')}.`
    );

    return { success: true, message: 'Pembatalan berhasil dikonfirmasi.' };
  }


  assignInstructorToBatch(payload: {
    batchId: number;
    instructorId: number;
  }): { success: boolean; message: string } {
    const targetBatch = this.getBatchById(payload.batchId);
    const instructor = this.instructors().find((i) => i.id === payload.instructorId);

    if (!targetBatch || !instructor) {
      return { success: false, message: 'Jadwal kelas atau pengajar tidak ditemukan.' };
    }

    const duplicate = this.batchInstructors().some(
      (bi) => bi.batchId === payload.batchId && bi.instructorId === payload.instructorId
    );
    if (duplicate) {
      const msg = `${instructor.fullName} sudah ditugaskan untuk ${targetBatch.batchName}.`;
      this.showNotification('danger', 'Pengajar sudah ditugaskan', msg);
      return { success: false, message: msg };
    }

    const existingBatches = this.getBatchesForInstructor(payload.instructorId).map(
      (item) => item.batch
    );

    for (const existing of existingBatches) {
      const isDateOverlap =
        targetBatch.startDate <= existing.endDate &&
        targetBatch.endDate >= existing.startDate;

      const isTimeOverlap =
        targetBatch.startTime < existing.endTime &&
        targetBatch.endTime > existing.startTime;

      if (isDateOverlap && isTimeOverlap) {
        const msg = `${instructor.fullName} sudah mengajar di "${existing.batchName}" (${existing.startDate} s/d ${existing.endDate}, jam ${existing.startTime}–${existing.endTime}) yang bertabrakan dengan "${targetBatch.batchName}" (${targetBatch.startDate} s/d ${targetBatch.endDate}, jam ${targetBatch.startTime}–${targetBatch.endTime}).`;
        this.showNotification('danger', 'Bentrok Jadwal Mengajar', msg);
        return { success: false, message: msg };
      }
    }

    const newAssignment: BatchInstructor = {
      id: Date.now(),
      batchId: payload.batchId,
      instructorId: payload.instructorId,
    };

    this.batchInstructors.update((list) => [...list, newAssignment]);
    this.showNotification(
      'success',
      'Penugasan Berhasil',
      `${instructor.fullName} ditugaskan ke ${targetBatch.batchName}.`
    );

    return {
      success: true,
      message: `Penugasan ${instructor.fullName} ke ${targetBatch.batchName} berhasil disimpan.`,
    };
  }

  removeInstructorAssignment(assignmentId: number): void {
    this.batchInstructors.update((list) => list.filter((bi) => bi.id !== assignmentId));
    this.showNotification('info', 'Penugasan Dihapus', 'Penugasan mengajar telah dihapus.');
  }

  addInstructorByAdmin(payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    expertise: string;
    bio: string;
  }): { success: boolean; message: string } {
    const emailNorm = payload.email.trim().toLowerCase();
    if (this.instructors().some(i => i.email.toLowerCase() === emailNorm) || this.currentUser()?.email.toLowerCase() === emailNorm) {
      return { success: false, message: 'Email sudah digunakan oleh akun lain.' };
    }

    const newUserId = Date.now();
    const newInstructor: Instructor = {
      id: Date.now() + 1,
      userId: newUserId,
      fullName: payload.fullName.trim(),
      expertise: payload.expertise.trim(),
      bio: payload.bio.trim() || 'Instructor Karsa Studio.',
      email: emailNorm,
      phoneNumber: payload.phoneNumber.trim(),
    };

    this.instructors.update((list) => [...list, newInstructor]);
    this.showNotification(
      'success',
      'Pengajar ditambahkan',
      `${newInstructor.fullName} telah ditambahkan sebagai pengajar.`
    );
    return { success: true, message: 'Pengajar berhasil ditambahkan.' };
  }

  updateInstructorByAdmin(
    instructorId: number,
    payload: {
      fullName: string;
      email: string;
      phoneNumber: string;
      expertise: string;
      bio: string;
    }
  ): void {
    this.instructors.update((list) =>
      list.map((i) =>
        i.id === instructorId
          ? {
              ...i,
              fullName: payload.fullName.trim(),
              email: payload.email.trim().toLowerCase(),
              phoneNumber: payload.phoneNumber.trim(),
              expertise: payload.expertise.trim(),
              bio: payload.bio.trim(),
            }
          : i
      )
    );
    this.showNotification('success', 'Profil pengajar diperbarui', 'Perubahan profil pengajar telah disimpan.');
  }

  deleteInstructorByAdmin(instructorId: number): void {
    this.batchInstructors.update((list) =>
      list.filter((bi) => bi.instructorId !== instructorId)
    );
    this.instructors.update((list) => list.filter((i) => i.id !== instructorId));
    this.showNotification('info', 'Pengajar dihapus', 'Data pengajar telah dihapus.');
  }

  saveCourseByAdmin(payload: {
    id?: number;
    categoryId: number;
    title: string;
    description: string;
    syllabus: string;
    durationHours: number;
    basePrice: number;
  }): void {
    if (payload.id) {
      this.courses.update((list) =>
        list.map((c) =>
          c.id === payload.id
            ? {
                ...c,
                categoryId: Number(payload.categoryId),
                title: payload.title.trim(),
                description: payload.description.trim(),
                syllabus: payload.syllabus.trim(),
                durationHours: Number(payload.durationHours) || 36,
                basePrice: Number(payload.basePrice) || 1000000,
              }
            : c
        )
      );
      this.showNotification('success', 'Kelas diperbarui', `Data ${payload.title} berhasil diubah.`);
    } else {
      const newCourse: Course = {
        id: Date.now(),
        categoryId: Number(payload.categoryId),
        title: payload.title.trim(),
        description: payload.description.trim(),
        syllabus: payload.syllabus.trim() || '1. Konsep Inti\n2. Praktikum Studio',
        durationHours: Number(payload.durationHours) || 36,
        basePrice: Number(payload.basePrice) || 1000000,
      };
      this.courses.update((list) => [...list, newCourse]);
      this.showNotification('success', 'Kelas ditambahkan', `${newCourse.title} berhasil dibuat.`);
    }
  }

  deleteCourseByAdmin(courseId: number): void {
    this.courses.update((list) => list.filter((c) => c.id !== courseId));
    this.showNotification('info', 'Kelas dihapus', 'Kelas telah dihapus dari katalog.');
  }

  saveBatchByAdmin(payload: {
    id?: number;
    courseId: number;
    locationId: number;
    batchName: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    maxSeats: number;
    status: 'Open' | 'Full';
  }): void {
    if (payload.id) {
      this.batches.update((list) =>
        list.map((b) =>
          b.id === payload.id
            ? {
                ...b,
                courseId: Number(payload.courseId),
                locationId: Number(payload.locationId),
                batchName: payload.batchName.trim(),
                startDate: payload.startDate,
                endDate: payload.endDate,
                startTime: payload.startTime,
                endTime: payload.endTime,
                maxSeats: Number(payload.maxSeats) || 30,
                status: payload.status,
              }
            : b
        )
      );
      this.showNotification('success', 'Jadwal diperbarui', 'Perubahan jadwal kelas telah disimpan.');
    } else {
      const newId = Date.now();
      const newBatch: CourseBatch = {
        id: newId,
        courseId: Number(payload.courseId),
        locationId: Number(payload.locationId),
        batchName: payload.batchName.trim(),
        startDate: payload.startDate,
        endDate: payload.endDate,
        startTime: payload.startTime,
        endTime: payload.endTime,
        maxSeats: Number(payload.maxSeats) || 30,
        status: payload.status,
      };
      this.batchSeatBaseline.update((prev) => ({
        ...prev,
        [newId]: { usedSeats: 0, nextQueue: 1 },
      }));
      this.batches.update((list) => [...list, newBatch]);
      this.showNotification('success', 'Jadwal ditambahkan', `${newBatch.batchName} telah dibuka.`);
    }
  }

  deleteBatchByAdmin(batchId: number): void {
    this.batchInstructors.update((list) => list.filter((bi) => bi.batchId !== batchId));
    this.batches.update((list) => list.filter((b) => b.id !== batchId));
    this.showNotification('info', 'Jadwal dihapus', 'Jadwal kelas telah dihapus.');
  }
}
