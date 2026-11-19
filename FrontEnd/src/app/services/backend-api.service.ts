import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface CourseCategory {
  id: number;
  name: string;
  description?: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
}

export interface CourseBatch {
  id: number;
  courseId: number;
  instructorId: number;
  startDate: string;
  endDate: string;
  capacity: number;
  availableSeats: number;
}

export interface RegistrationCreate {
  batchId: number;
  paymentMethod: 'UPFRONT' | 'INSTALLMENT';
  installmentTenor?: number;
}

export interface ApiRegistration {
  id: number;
  studentId: number;
  batchId: number;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  paidAmount: number;
}

@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly http = inject(HttpClient);

  getCourseCategories() {
    return this.http.get<CourseCategory[]>('/api/course-categories');
  }

  getLocations() {
    return this.http.get<Location[]>('/api/locations');
  }

  getCourseBatches() {
    return this.http.get<CourseBatch[]>('/api/CourseBatch');
  }

  getCourseBatch(id: number) {
    return this.http.get<CourseBatch>(`/api/CourseBatch/${id}`);
  }

  getMyRegistrations() {
    return this.http.get<ApiRegistration[]>('/api/Registration/me');
  }

  getRegistration(id: number) {
    return this.http.get<ApiRegistration>(`/api/Registration/${id}`);
  }

  createRegistration(request: RegistrationCreate) {
    return this.http.post<ApiRegistration>('/api/Registration', request);
  }

  cancelRegistration(id: number) {
    return this.http.delete(`/api/Registration/${id}`);
  }

  confirmUpfrontRegistration(id: number) {
    return this.http.post(`/api/Registration/${id}/confirm-upfront`, {});
  }

  confirmInstallment(scheduleId: number) {
    return this.http.post(`/api/Registration/installments/${scheduleId}/confirm`, {});
  }
}
