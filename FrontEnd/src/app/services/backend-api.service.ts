import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RefundCalculationResult } from '../models/course-system.models';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of, throwError } from 'rxjs';
import { BatchInstructor, Course, CourseBatch, CourseCategory, InstallmentSchedule, Instructor, Location, PaymentDetail, PaymentStatus, Registration, Student } from '../models/course-system.models';

interface CourseRow extends Omit<Course, 'title' | 'description'> {
  categoryName: string;
}
interface BatchRow extends Omit<CourseBatch, 'status'> {
  courseStatus: string | number;
}
export interface AssignmentRow extends BatchInstructor {
  instructorName: string;
  expertise: string;
  bio: string;
}
export type StudentProfileFields = Omit<Student, 'id' | 'userId'>;
type StudentResponse = Omit<Student, 'educationLevel'> & { educationalLevel: string };

type ScheduleRow = Omit<InstallmentSchedule, 'status' | 'registrationId'> & { installmentStatus: string | number };
interface RegistrationRow extends Omit<Registration, 'paymentMethod' | 'registrationStatus' | 'paymentStatus'> {
  paymentMethod: 'UPFRONT' | 'INSTALLMENT';
  registrationStatus: string | number;
  paymentStatus: string | number;
  installments: ScheduleRow[];
}

const registrationStatuses: Registration['registrationStatus'][] = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
const paymentStatuses: PaymentStatus[] = ['Pending', 'PartiallyPaid', 'Paid', 'Overdue', 'Failed'];
const installmentStatuses: InstallmentSchedule['status'][] = ['Pending', 'Paid', 'Overdue'];
const batchStatuses: CourseBatch['status'][] = ['Open', 'Full'];
type PaymentRow = Omit<PaymentDetail, 'paymentMethod' | 'registrationStatus' | 'paymentStatus' | 'installmentSchedules'>
  & Pick<RegistrationRow, 'paymentMethod' | 'registrationStatus' | 'paymentStatus'>
  & { installmentSchedules: (ScheduleRow & { registrationId: number; remainingAmount: number })[] };
type Resource = 'courses' | 'course-categories' | 'locations' | 'instructors' | 'CourseBatch';

function toStudent({ educationalLevel, ...student }: StudentResponse): Student {
  return { ...student, educationLevel: educationalLevel };
}

function decodeStatus<T extends string>(value: string | number, statuses: readonly T[]): T {
  if (typeof value === 'number' && statuses[value]) return statuses[value];
  if (typeof value === 'string') {
    const name = value.replace(/_/g, '').toUpperCase();
    const status = statuses.find(item => item.toUpperCase() === name);
    if (status) return status;
  }
  throw new Error('Status dari server tidak dikenali: ' + value);
}

function paymentFields(row: Pick<RegistrationRow, 'paymentMethod' | 'registrationStatus' | 'paymentStatus'>):
  Pick<Registration, 'paymentMethod' | 'registrationStatus' | 'paymentStatus'> {
  return {
    paymentMethod: row.paymentMethod === 'UPFRONT' ? 'Upfront' : 'Installment',
    registrationStatus: decodeStatus(row.registrationStatus, registrationStatuses),
    paymentStatus: decodeStatus(row.paymentStatus, paymentStatuses),
  };
}

@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly http = inject(HttpClient);

  catalog() {
    return forkJoin({
      categories: this.http.get<CourseCategory[]>('/api/course-categories'),
      locations: this.http.get<Location[]>('/api/locations'),
      courses: this.http.get<CourseRow[]>('/api/courses'),
      batches: this.http.get<BatchRow[]>('/api/CourseBatch'),
    }).pipe(map(data => ({
      ...data,
      courses: data.courses.map(row => ({
        ...row,
        title: row.categoryName + ' · ' + row.id,
        description: data.categories.find(category => category.id === row.categoryId)?.description ?? '',
      })),
      batches: data.batches.map((row): CourseBatch => ({
        ...row,
        status: decodeStatus(row.courseStatus, batchStatuses),
        startTime: row.startTime.slice(0, 5),
        endTime: row.endTime.slice(0, 5),
      })),
    })));
  }

  instructors() {
    return this.http.get<Instructor[]>('/api/instructors');
  }

  instructorAssignments() {
    return this.http.get<AssignmentRow[]>('/api/BatchInstructor');
  }

  myInstructorProfile() {
    return this.http.get<Instructor>('/api/instructors/me');
  }

  students(admin = true) {
    if (admin) {
      return this.http.get<StudentResponse[]>('/api/students').pipe(map(rows => rows.map(toStudent)));
    }
    return this.getMyProfile().pipe(
      map(student => [student]),
      catchError((error: HttpErrorResponse) => error.status === 404 ? of([]) : throwError(() => error)),
    );
  }

  getMyProfile() {
    return this.http.get<StudentResponse>('/api/students/me').pipe(map(toStudent));
  }

  saveMyProfile(profile: StudentProfileFields, exists: boolean) {
    const { educationLevel, ...fields } = profile;
    return this.http.request<StudentResponse>(exists ? 'PUT' : 'POST', '/api/students/me', {
      body: { ...fields, educationalLevel: educationLevel },
    }).pipe(map(toStudent));
  }

  registrations(admin: boolean) {
    const url = admin ? '/api/Registration' : '/api/Registration/me';
    return this.http.get<RegistrationRow[]>(url).pipe(map(rows => ({
      registrations: rows.map(({ installments, ...row }): Registration => ({
        ...row,
        ...paymentFields(row),
      })),
      schedules: rows.flatMap(row => row.installments.map(({ installmentStatus, ...item }): InstallmentSchedule => ({
        ...item,
        registrationId: row.id,
        status: decodeStatus(installmentStatus, installmentStatuses),
      }))),
    })));
  }

  createRegistration(batchId: number, paymentMethod: Registration['paymentMethod'], installmentTenor: number | null) {
    return this.http.post<{ id: number }>('/api/Registration', {
      batchId,
      paymentMethod: paymentMethod.toUpperCase(),
      installmentTenor,
    });
  }

  cancelRegistration(id: number) {
    return this.http.delete('/api/Registration/' + id);
  }

  cancellationPreview(id: number) {
    return this.http.get<RefundCalculationResult>(`/api/Registration/${id}/cancellation-preview`);
  }

  confirmRefund(id: number, reference: string) {
    return this.http.post(`/api/Registration/${id}/confirm-refund`, { reference: reference.trim() });
  }

  paymentDetail(id: number) {
    return this.http.get<PaymentRow>(`/api/Registration/${id}/payment`).pipe(map((row): PaymentDetail => ({
      ...row,
      ...paymentFields(row),
      installmentSchedules: row.installmentSchedules.map(({ installmentStatus, ...schedule }) => ({
        ...schedule, status: decodeStatus(installmentStatus, installmentStatuses),
      })),
    })));
  }

  confirmUpfront(id: number) {
    return this.http.post<PaymentRow>(`/api/Registration/${id}/confirm-upfront`, {});
  }

  confirmInstallment(id: number, paidAmount?: number) {
    const body = paidAmount === undefined ? {} : { paidAmount };
    return this.http.post<PaymentRow>(`/api/Registration/installments/${id}/confirm`, body);
  }

  processOverdue() {
    return this.http.post('/api/Registration/process-overdue', {});
  }

  assignment(batchId: number, instructorId: number, remove: boolean) {
    return remove
      ? this.http.delete('/api/BatchInstructor', { params: { batchId, instructorId } })
      : this.http.post('/api/BatchInstructor', { batchId, instructorId });
  }

  save(resource: Resource, id: number | undefined, body: object) {
    const url = '/api/' + resource;
    return id === undefined ? this.http.post(url, body) : this.http.put(url + '/' + id, body);
  }

  remove(resource: Resource, id: number) {
    return this.http.delete('/api/' + resource + '/' + id);
  }
}
