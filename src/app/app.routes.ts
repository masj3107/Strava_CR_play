import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { SegmentsComponent } from './segments/segments.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'segments', component: SegmentsComponent },
  { path: ':dataset', component: SegmentsComponent },
];
