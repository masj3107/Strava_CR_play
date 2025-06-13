import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SegmentsComponent } from './segments.component';

describe('SegmentsComponent', () => {
  let component: SegmentsComponent;
  let fixture: ComponentFixture<SegmentsComponent>;
  let httpTestingController: HttpTestingController;

  const mockSegments = [
    {
      type: 'Run',
      name: 'Segment 1',
      link: 'http://example.com/1',
      distance_km: 1,
      elevation_m: 10,
      time: '1:00',
      time_link: 'http://example.com/time1',
      date: '2022-01-01',
      effort_count: 1,
      athlete_count: 1,
      polyline: ''
    },
    {
      type: 'Ride',
      name: 'Segment 2',
      link: 'http://example.com/2',
      distance_km: 2,
      elevation_m: 20,
      time: '2:00',
      time_link: 'http://example.com/time2',
      date: '2023-05-05',
      effort_count: 2,
      athlete_count: 2,
      polyline: ''
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NoopAnimationsModule, SegmentsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentsComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load segments on init', () => {
    fixture.detectChanges();

    const req = httpTestingController.expectOne('assets/segments.json');
    req.flush(mockSegments);

    expect(component.segments.length).toBe(2);
    expect(component.dataSource.data).toEqual(mockSegments);
  });

  it('should calculate CRs per year', () => {
    component.segments = [
      { date: '2022-01-01' },
      { date: '2022-05-01' },
      { date: '2023-07-01' }
    ] as any[];

    component.calculateCRsPerYear();

    expect(component.crsPerYear).toEqual({ '2022': 2, '2023': 1 });
  });
});
