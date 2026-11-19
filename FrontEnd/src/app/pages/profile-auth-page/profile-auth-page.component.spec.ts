import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';
import { ProfileAuthPageComponent } from './profile-auth-page.component';

describe('Student profile form', () => {
  const user = { id: 7, role: 'Student', fullName: 'Peserta', email: 'peserta@example.test' };
  const stored = { id: 5, userId: user.id, fullName: 'Nama tersimpan', phoneNumber: '081234567890',
    address: 'Jalan Uji', city: 'Bandung', province: 'Jawa Barat', country: 'Indonesia',
    educationalLevel: 'D3', occupation: '' };
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { user: () => user } }] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('memuat profil tersimpan dan memperbaruinya setelah nomor telepon valid', async () => {
    const svc = TestBed.inject(CourseSystemService);
    const fixture = TestBed.createComponent(ProfileAuthPageComponent);
    fixture.detectChanges();
    const read = http.expectOne({ method: 'GET', url: '/api/students/me' });
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    read.flush(stored);
    fixture.detectChanges();
    expect(fixture.componentInstance.profileForm.controls.educationLevel.value).toBe('D3');
    expect(fixture.componentInstance.profileForm.controls.fullName.value).toBe(stored.fullName);
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    const phone: HTMLInputElement = form.querySelector('input[type=tel]')!;
    const original = svc.currentStudentProfile()!.phoneNumber;
    expect(phone.value).toBe(original);

    const submit = (value: string) => {
      phone.value = value;
      phone.dispatchEvent(new Event('input'));
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();
    };

    submit('0812abc');
    expect(form.querySelector('#profile-phone-error')).toBeTruthy();
    expect(svc.currentStudentProfile()!.phoneNumber).toBe(original);

    submit('+62 812-3456-7890');
    expect(form.querySelector('#profile-phone-error')).toBeNull();
    const write = http.expectOne({ method: 'PUT', url: '/api/students/me' });
    expect(write.request.body.educationalLevel).toBe(stored.educationalLevel);
    expect(write.request.body.phoneNumber).toBe('+62 812-3456-7890');
    write.flush({ ...stored, phoneNumber: write.request.body.phoneNumber });
    await fixture.whenStable();
    expect(svc.currentStudentProfile()!.phoneNumber).toBe('+62 812-3456-7890');
    expect(svc.isStudentProfileComplete(user.id)).toBeFalse();
  });

  it('menampilkan opsi coba lagi setelah gangguan dan membuat profil hanya setelah 404', async () => {
    const fixture = TestBed.createComponent(ProfileAuthPageComponent);
    fixture.detectChanges();
    http.expectOne('/api/students/me').flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    http.expectOne('/api/students/me').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.componentInstance.profileForm.controls.fullName.value).toBe(user.fullName);
    fixture.componentInstance.profileForm.controls.phoneNumber.setValue(stored.phoneNumber);
    fixture.componentInstance.saveProfile();
    http.expectOne({ method: 'POST', url: '/api/students/me' }).flush(stored);
    await fixture.whenStable();
    expect(fixture.componentInstance.svc.currentStudentProfile()?.id).toBe(stored.id);
  });
});
