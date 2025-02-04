import { Component, OnInit } from '@angular/core';
import { WeatherService, WeatherData } from './services/weather.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faWind, faTemperatureHigh, faSun, faCloudRain } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, FontAwesomeModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  weatherData!: WeatherData;

  constructor(private weatherService: WeatherService, library: FaIconLibrary) {
    library.addIcons(faWind, faTemperatureHigh, faSun, faCloudRain); // Lägg till ikonerna
  }

  ngOnInit(): void {
    this.weatherService.getWeatherData().subscribe({
      next: (data) => {
        console.log('Weather Data:', data);
        this.weatherData = data;
      },
      error: (err) => {
        console.error('Error fetching weather data:', err);
      }
    });
  }
}
