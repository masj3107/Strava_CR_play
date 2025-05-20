import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-segments',
  standalone: true,
  templateUrl: './segments.component.html',
  styleUrls: ['./segments.component.css'],
  imports: [CommonModule, MatIconModule, MatTableModule, MatSortModule, MatToolbarModule, MatCardModule, MatChipsModule, MatButtonModule, MatTooltipModule],
})
export class SegmentsComponent implements OnInit, AfterViewInit {
  segments: any[] = [];
  crsPerYear: { [year: string]: number } = {};
  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = ['type', 'name', 'distance_km', 'elevation_m', 'time', 'effort_count', 'athlete_count', 'date'];
  map!: L.Map;
  mapInitialized = false;

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>('assets/segments.json').pipe(
      catchError(error => {
        console.error('Error loading segment data:', error);
        return throwError(() => new Error('Failed to load segments.json'));
      })
    ).subscribe((data: any[]) => {
      this.segments = data;
      this.dataSource.data = this.segments;
      this.calculateCRsPerYear();
      
      // ✅ Ensure map is initialized before loading polylines
      if (this.mapInitialized) {
        this.loadSegments();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.mapInitialized) {
      this.initMap();
      this.mapInitialized = true;
      this.loadSegments(); // ✅ Ensure polylines are loaded
    }

    this.dataSource.sort = this.sort;
  }

  calculateCRsPerYear(): void {
    this.crsPerYear = this.segments.reduce((acc, segment) => {
      const year = new Date(segment.date).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as { [year: string]: number });
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [63.18, 14.64], 
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private loadSegments(): void {
    if (!this.map) {
      console.error("Map is not initialized yet.");
      return;
    }

    this.segments.forEach((segment) => {
      if (segment.polyline) {
        const latlngs = this.decodePolyline(segment.polyline);
        if (!latlngs.length) return;

        const startPoint = latlngs[0];

        // ✅ Fix: Use Leaflet's built-in Marker for better compatibility
        const startIcon = L.divIcon({
          className: 'custom-start-icon',
          html: '<span class="material-icons">place</span>',
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        });

        // ✅ Fix: Ensure polylines are added to the map
        L.polyline(latlngs, { color: 'blue', weight: 4 }).addTo(this.map)
          .bindPopup(`<b>${segment.name}</b><br>Distance: ${segment.distance_km} km`);

        // ✅ Fix: Ensure start markers are added properly
        L.marker(startPoint, { icon: startIcon }).addTo(this.map)
          .bindPopup(`<b>Start: ${segment.name}</b>`);
      } else {
        console.warn(`Segment ${segment.name} is missing a polyline.`);
      }
    });
  }

  private decodePolyline(str: string, precision: number = 5): L.LatLngTuple[] {
    let index = 0, lat = 0, lng = 0;
    const coordinates: L.LatLngTuple[] = [];
    const factor = Math.pow(10, precision);

    while (index < str.length) {
      let result = 1, shift = 0, byte;
      do {
        byte = str.charCodeAt(index++) - 63 - 1;
        result += byte << shift;
        shift += 5;
      } while (byte >= 0x1f);
      lat += (result & 1 ? ~(result >> 1) : (result >> 1));

      result = 1, shift = 0;
      do {
        byte = str.charCodeAt(index++) - 63 - 1;
        result += byte << shift;
        shift += 5;
      } while (byte >= 0x1f);
      lng += (result & 1 ? ~(result >> 1) : (result >> 1));

      coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
  }
}
