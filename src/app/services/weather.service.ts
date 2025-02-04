import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';


export interface WeatherForecast {
  day: string;
  temperature: string;
  wind: string;
}

export interface WeatherData {
  temperature: string;
  wind: string;
  description: string;
  forecast: WeatherForecast[];
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = `https://goweather.herokuapp.com/weather/Curitiba`;
  
  constructor(private http: HttpClient) {}

  getWeatherData(): Observable<WeatherData> {
    return this.http.get<WeatherData>(this.apiUrl);
  }
}
