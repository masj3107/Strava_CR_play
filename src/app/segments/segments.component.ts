import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, ParamMap } from '@angular/router';

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
  private segmentLayer = L.layerGroup();

  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params: ParamMap) => {
          const dataset = this.resolveDataset(params.get('dataset'));
          const assetPath = `assets/${dataset}.json`;
          return this.http.get<any[]>(assetPath).pipe(
            catchError(error => {
              console.error(`Error loading segment data from ${assetPath}:`, error);
              return of([] as any[]);
            })
          );
        })
      )
      .subscribe((data: any[]) => {
        this.segments = data;
        this.dataSource.data = this.segments;
        this.calculateCRsPerYear();

        if (this.mapInitialized) {
          this.clearSegments();
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

    this.segmentLayer.addTo(this.map);
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
        L.polyline(latlngs, { color: 'blue', weight: 4 }).addTo(this.segmentLayer)
          .bindPopup(`<b>${segment.name}</b><br>Distance: ${segment.distance_km} km`);

        // ✅ Fix: Ensure start markers are added properly
        L.marker(startPoint, { icon: startIcon }).addTo(this.segmentLayer)
          .bindPopup(`<b>Start: ${segment.name}</b>`);
      } else {
        console.warn(`Segment ${segment.name} is missing a polyline.`);
      }
    });
  }

  private clearSegments(): void {
    this.segmentLayer.clearLayers();
  }

  private resolveDataset(datasetParam: string | null): string {
    if (!datasetParam || datasetParam === 'segments') {
      return 'segments';
    }

    const isSafeName = /^[a-zA-Z0-9_-]+$/.test(datasetParam);
    if (!isSafeName) {
      console.warn(`Invalid dataset name: ${datasetParam}. Falling back to segments.json.`);
      return 'segments';
    }

    return datasetParam;
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
