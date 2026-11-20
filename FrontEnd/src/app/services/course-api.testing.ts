import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { CourseSystemService } from './course-system.service';

export const accountId = 72;
export const student = { id: 4, userId: accountId, fullName: 'Peserta Uji', phoneNumber: '', address: '', city: '',
  province: '', country: '', educationalLevel: '', occupation: '' };
export const instructor = { id: 14, userId: 80, fullName: 'Pengajar', email: 'pengajar@example.test', phoneNumber: '',
  expertise: 'ASP.NET Core, SQL Server, PostgreSQL, Distributed Systems', bio: '' };

export function apiTestProviders(role: 'Admin' | 'Student') {
  const user = { id: accountId, role, fullName: 'Akun Uji', email: 'uji@example.test' };
  return [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService,
    useValue: { accessToken: () => null, user: () => user } }];
}

const registration = { id: 1, studentId: student.id, batchId: 9, registrationNumber: 'REG-1',
  registrationDate: new Date().toISOString(), queueNumber: 1, basePrice: 1000000, earlyBirdDiscount: 100000,
  taxRate: 11, taxAmount: 99000, totalAmount: 999000, paymentMethod: 'INSTALLMENT', installmentTenor: 3,
  paymentStatus: 1, registrationStatus: 1, paidAmount: 333000, installments: [
    { id: 20, installmentNumber: 1, dueDate: '2027-01-01', amount: 333000, paidAt: null, paidAmount: 333000, installmentStatus: 1 },
  ] };

export function flushCourseData(role: 'Admin' | 'Student' | 'Guest', options = { phone: '', expertise: instructor.expertise, cancelled: false }) {
  const http = TestBed.inject(HttpTestingController);
  const date = new Date(Date.now() + 16 * 86400000).toISOString().slice(0, 10);
  http.expectOne('/api/course-categories').flush([{ id: 5, name: 'Backend', description: '' }]);
  http.expectOne('/api/locations').flush([{ id: 7, name: 'Studio', city: 'Bandung', address: 'Jalan Uji', roomName: 'A1' }]);
  http.expectOne('/api/courses').flush([{ id: 6, categoryId: 5, categoryName: 'Backend', syllabus: 'SQL', durationHours: 8, basePrice: 1000000 }]);
  http.expectOne('/api/CourseBatch').flush([{ id: 9, courseId: 6, locationId: 7, batchName: 'Grup B', startDate: date,
    endDate: date, startTime: '09:00:00', endTime: '11:00:00', maxSeats: 30, usedSeats: 1, nextQueue: 3, courseStatus: 0 }]);
  http.expectOne('/api/BatchInstructor').flush([{ id: 12, batchId: 9, instructorId: instructor.id,
    instructorName: instructor.fullName, expertise: instructor.expertise, bio: instructor.bio }]);
  if (role === 'Guest') return;
  const admin = role === 'Admin';
  const profile = { ...student, phoneNumber: options.phone };
  if (admin) http.expectOne('/api/students').flush([profile]);
  http.expectOne(admin ? '/api/Registration' : '/api/Registration/me').flush([
    { ...registration, registrationStatus: options.cancelled ? 2 : 1 },
    { ...registration, id: 2, paymentMethod: 'UPFRONT', installmentTenor: null, paymentStatus: 0, registrationStatus: 0, paidAmount: 0, totalAmount: 1318125, installments: [] },
    { ...registration, id: 3, paymentStatus: 0, registrationStatus: 0, paidAmount: 0,
      installments: [{ ...registration.installments[0], id: 30, installmentStatus: 0, paidAmount: 0 }] },
  ]);
  if (admin) http.expectOne('/api/instructors').flush([{ ...instructor, expertise: options.expertise }]);
}

export async function loadCourseData(role: 'Student' | 'Admin') {
  const service = TestBed.inject(CourseSystemService);
  TestBed.flushEffects();
  if (role === 'Student') TestBed.inject(HttpTestingController).expectOne('/api/students/me').flush(student);
  const load = service.reload();
  flushCourseData(role);
  await load;
  return service;
}
