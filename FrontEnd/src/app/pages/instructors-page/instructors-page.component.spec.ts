import { HttpTestingController } from '@angular/common/http/testing';
import { apiTestProviders, flushCourseData, loadCourseData } from '../../services/course-api.testing';
import { TestBed } from '@angular/core/testing';
import { appConfig } from '../../app.config';
import { InstructorsPageComponent } from './instructors-page.component';

describe('Keahlian pengajar', () => {
  it('menampilkan keahlian lama per kartu dan menyimpan susunan hasil edit', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, ...apiTestProviders('Admin')] });
    const fixture = TestBed.createComponent(InstructorsPageComponent);
    const page = fixture.componentInstance;
    const view: HTMLElement = fixture.nativeElement;
    const skills = () => Array.from(view.querySelector('ul.skill-list')!.children, li => li.textContent!.trim());
    await loadCourseData('Admin');
    fixture.detectChanges();
    expect(skills()).toEqual(['ASP.NET Core', 'SQL Server', 'PostgreSQL', 'Distributed Systems']);
    const instructor = page.svc.instructors()[0];
    page.editInstructor(instructor);
    fixture.detectChanges();
    view.querySelector<HTMLButtonElement>('button[aria-label="Pindahkan SQL Server lebih awal"]')!.click();
    view.querySelector<HTMLButtonElement>('button[aria-label="Hapus keahlian PostgreSQL"]')!.click();
    page.pendingSkill = 'Cloud, sql server';
    expect(page.svc.instructors()[0].expertise).toBe(instructor.expertise);
    const saving = page.saveInstructor();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/instructors/' + instructor.id);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.expertise).toBe('SQL Server, ASP.NET Core, Distributed Systems, Cloud');
    request.flush({});
    await Promise.resolve();
    flushCourseData('Admin', { phone: '', expertise: request.request.body.expertise, cancelled: false });
    await saving;
    fixture.detectChanges();
    expect(skills()).toEqual(['SQL Server', 'ASP.NET Core', 'Distributed Systems', 'Cloud']);
    page.editInstructor(page.svc.instructors()[0]);
    expect(page.form.expertise).toEqual(skills());
  });
});

describe('Peringatan jadwal pengajar', () => {
  it('menunjukkan jadwal bentrok dan mengizinkan penugasan tepat setelah kelas sebelumnya', async () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers, ...apiTestProviders('Admin')] });
    const svc = await loadCourseData('Admin');
    const [assigned] = svc.batches();
    const instructorId = svc.instructors()[0].id;
    const overlap = { ...assigned, id: 10, startTime: '10:00', endTime: '12:00' };
    const adjacent = { ...assigned, id: 11, startTime: assigned.endTime, endTime: '12:00' };
    svc.batches.set([assigned, overlap, adjacent]);
    const fixture = TestBed.createComponent(InstructorsPageComponent);
    const page = fixture.componentInstance;
    const view: HTMLElement = fixture.nativeElement;
    page.selectedInstructorId.set(instructorId);
    page.selectedBatchId.set(overlap.id);
    fixture.detectChanges();
    const submit = Array.from(view.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Tugaskan')!;
    expect(view.querySelector('[role=alert]')?.textContent).toContain(assigned.batchName);
    expect(submit.disabled).toBeTrue();
    await page.submitAssignment();
    const http = TestBed.inject(HttpTestingController);
    http.expectNone(request => request.method === 'POST');

    page.selectedBatchId.set(adjacent.id);
    fixture.detectChanges();
    expect(view.querySelector('[role=alert]')).toBeNull();
    expect(submit.disabled).toBeFalse();
    const saving = page.submitAssignment();
    const request = http.expectOne(req => req.method === 'POST' && req.url === '/api/BatchInstructor');
    expect(request.request.body).toEqual({ batchId: adjacent.id, instructorId });
    expect(request.request.params.keys()).toEqual([]);
    const message = 'Instruktur sudah memiliki jadwal mengajar yang bentrok.';
    request.flush({ message }, { status: 400, statusText: 'Bad Request' });
    await saving;
    fixture.detectChanges();
    expect(view.querySelector('[role=alert]')?.textContent).toContain(message);
    http.verify();
  });
});
