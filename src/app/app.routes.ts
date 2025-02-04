import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { SegmentsComponent } from './segments/segments.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'segments', component: SegmentsComponent },
];
