import { AuthService } from '../../services/auth.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CourseSystemService } from '../../services/course-system.service';
import { ProfileAuthPageComponent } from './profile-auth-page.component';

describe('Student profile form', () => {
  it('blocks an invalid phone and saves a formatted number on a partial profile', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: { user: () => ({ id: -2, role: 'Student', fullName: 'Peserta', email: 'peserta@example.test' }) } }] });
    const svc = TestBed.inject(CourseSystemService);
    const fixture = TestBed.createComponent(ProfileAuthPageComponent);
    fixture.detectChanges();
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
    expect(svc.currentStudentProfile()!.phoneNumber).toBe('+62 812-3456-7890');
    expect(svc.isStudentProfileComplete(-2)).toBeFalse();
  });
});
