import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of, throwError } from 'rxjs';
import { BatchInstructor, Course, CourseBatch, CourseCategory, InstallmentSchedule, Instructor, Location, PaymentDetail, PaymentStatus, Registration, Student } from '../models/course-system.models';

interface CourseRow extends Omit<Course, 'title' | 'description'> { categoryName: string }
interface BatchRow extends Omit<CourseBatch, 'status'> { courseStatus: number }
interface AssignmentRow extends BatchInstructor { instructor: Omit<Instructor, 'phoneNumber' | 'email'> }
export type StudentProfileFields = Omit<Student, 'id' | 'userId'>;
type StudentResponse = Omit<Student, 'educationLevel'> & { educationalLevel: string };

function toStudent({ educationalLevel, ...student }: StudentResponse): Student {
  return { ...student, educationLevel: educationalLevel };
}
interface RegistrationRow extends Omit<Registration, 'paymentMethod' | 'registrationStatus' | 'paymentStatus'> {
  paymentMethod: 'UPFRONT' | 'INSTALLMENT';
  registrationStatus: number;
  paymentStatus: number;
  installmentSchedules: (Omit<InstallmentSchedule, 'status'> & { installmentStatus: number })[];
}

const registrationStatuses: Registration['registrationStatus'][] = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
const paymentStatuses: PaymentStatus[] = ['Pending', 'PartiallyPaid', 'Paid', 'Overdue', 'Failed'];
const installmentStatuses: InstallmentSchedule['status'][] = ['Pending', 'Paid', 'Overdue'];
type PaymentRow = Omit<PaymentDetail, 'paymentMethod' | 'registrationStatus' | 'paymentStatus' | 'installmentSchedules'>
  & Pick<RegistrationRow, 'paymentMethod' | 'registrationStatus' | 'paymentStatus'>
  & { installmentSchedules: (RegistrationRow['installmentSchedules'][number] & { remainingAmount: number })[] };
type Resource = 'courses' | 'course-categories' | 'locations' | 'instructors' | 'CourseBatch';

@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly http = inject(HttpClient);

  catalog() {
    return forkJoin({
      categories: this.http.get<CourseCategory[]>('/api/course-categories'),
      locations: this.http.get<Location[]>('/api/locations'),
      courses: this.http.get<CourseRow[]>('/api/courses'),
      batches: this.http.get<BatchRow[]>('/api/CourseBatch'),
      assignments: this.http.get<AssignmentRow[]>('/api/BatchInstructor'),
    }).pipe(map(data => ({
      ...data,
      courses: data.courses.map(row => ({ ...row, title: row.categoryName + ' · ' + row.id,
        description: data.categories.find(category => category.id === row.categoryId)?.description ?? '' })),
      batches: data.batches.map((row): CourseBatch => ({ ...row, status: row.courseStatus === 1 ? 'Full' : 'Open',
        startTime: row.startTime.slice(0, 5), endTime: row.endTime.slice(0, 5) })),
    })));
  }

  instructors() { return this.http.get<Instructor[]>('/api/instructors'); }

students(admin = true) {
  const rows = admin ? this.http.get<StudentResponse[]>('/api/students') :
    this.http.get<StudentResponse>('/api/students/me').pipe(map(row => [row]), catchError((error: HttpErrorResponse) =>
      error.status === 404 ? of([] as StudentResponse[]) : throwError(() => error)));
  return rows.pipe(map(list => list.map(toStudent)));
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

saveProfile(profile: StudentProfileFields, exists: boolean) {
  return this.saveMyProfile(profile, exists);
}

registrations(admin: boolean) {
  return this.http.get<RegistrationRow[]>(admin ? '/api/Registration' : '/api/Registration/me').pipe(map(rows => ({
    registrations: rows.map(({ installmentSchedules, ...row }): Registration => ({
      ...row, registrationStatus: registrationStatuses[row.registrationStatus], paymentStatus: paymentStatuses[row.paymentStatus],
      paymentMethod: row.paymentMethod === 'UPFRONT' ? 'Upfront' : 'Installment',
    })),
    schedules: rows.flatMap(row => row.installmentSchedules.map((item): InstallmentSchedule => ({
      ...item, status: installmentStatuses[item.installmentStatus],
    }))),
  })));
}

createRegistration(batchId: number, paymentMethod: Registration['paymentMethod'], installmentTenor: number | null) {
  return this.http.post<{ id: number }>('/api/Registration', { batchId, paymentMethod: paymentMethod.toUpperCase(), installmentTenor });
}

cancelRegistration(id: number) { return this.http.delete('/api/Registration/' + id); }

paymentDetail(id: number) {
  return this.http.get<PaymentRow>(`/api/Registration/${id}/payment`).pipe(map((row): PaymentDetail => ({
    ...row,
    paymentMethod: row.paymentMethod === 'UPFRONT' ? 'Upfront' : 'Installment',
    registrationStatus: registrationStatuses[row.registrationStatus],
    paymentStatus: paymentStatuses[row.paymentStatus],
    installmentSchedules: row.installmentSchedules.map(({ installmentStatus, ...schedule }) => ({
      ...schedule, status: installmentStatuses[installmentStatus],
    })),
  })));
}

confirmUpfront(id: number) { return this.http.post<PaymentRow>(`/api/Registration/${id}/confirm-upfront`, {}); }
confirmInstallment(id: number, paidAmount?: number) {
  const body = paidAmount === undefined ? {} : { paidAmount };
  return this.http.post<PaymentRow>(`/api/Registration/installments/${id}/confirm`, body);
}
processOverdue() { return this.http.post('/api/Registration/process-overdue', {}); }

assignment(batchId: number, instructorId: number, remove: boolean) {
  return this.http.request(remove ? 'DELETE' : 'POST', '/api/BatchInstructor', { params: { batchId, instructorId } });
}

save(resource: Resource, id: number | undefined, body: object) {
  const url = '/api/' + resource;
  return id === undefined ? this.http.post(url, body) : this.http.put(url + '/' + id, body);
}
  remove(resource: Resource, id: number) { return this.http.delete('/api/' + resource + '/' + id); }
}
