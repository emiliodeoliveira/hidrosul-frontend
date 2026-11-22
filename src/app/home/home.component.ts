import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

interface Reservoir {
  code: string;
  name: string;
  basin: string;
  subsystem: string;
}

interface ForecastHour {
  time: string;
  temperature_c: number | null;
  precipitation_mm: number | null;
  precipitation_probability_percent: number | null;
}

interface Forecast {
  timezone: string;
  hourly: ForecastHour[];
}

interface WeatherObservation {
  station_code: string;
  timestamp: string;
  level_m: number | null;
  source: string;
}

interface City {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private apiUrl = environment.apiUrl.replace(/\/$/, '');

  readonly cities: City[] = [
    { name: 'Porto Alegre', state: 'RS', latitude: -30.0346, longitude: -51.2177 },
    { name: 'Guaíba', state: 'RS', latitude: -30.1087, longitude: -51.3250 },
    { name: 'Canoas', state: 'RS', latitude: -29.9178, longitude: -51.1839 },
    { name: 'São Leopoldo', state: 'RS', latitude: -29.7606, longitude: -51.1471 },
    { name: 'Campo Bom', state: 'RS', latitude: -29.6789, longitude: -51.0608 },
    { name: 'Novo Hamburgo', state: 'RS', latitude: -29.6783, longitude: -51.1306 },
    { name: 'Caxias do Sul', state: 'RS', latitude: -29.1680, longitude: -51.1794 },
    { name: 'Santa Maria', state: 'RS', latitude: -29.6872, longitude: -53.8149 },
    { name: 'Pelotas', state: 'RS', latitude: -31.7700, longitude: -52.3420 },
  ];

  selectedCity = this.cities[0];
  locationStatus = '';
  isLocating = false;

  reservoirs: Reservoir[] = [];
  forecast: Forecast | null = null;
  weatherObservations: WeatherObservation[] = [];
  inmetAvailable = false;
  loading = true;
  showAlertSignup = false;
  alertEmail = '';
  alertPhone = '';
  alertCondition = 'chuva intensa';
  alertSubmitting = false;
  alertMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  selectCity(cityName: string): void {
    const city = this.cities.find(item => item.name === cityName);
    if (!city) {
      return;
    }
    this.selectedCity = city;
    this.locationStatus = '';
    this.loadForecast();
  }

  useMyLocation(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.locationStatus = 'Seu navegador não permite localização.';
      return;
    }

    this.isLocating = true;
    this.locationStatus = 'Obtendo sua localização...';
    navigator.geolocation.getCurrentPosition(
      position => {
        this.selectedCity = {
          name: 'Sua localização',
          state: 'RS',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.locationStatus = 'Localização atual utilizada';
        this.isLocating = false;
        this.loadForecast();
      },
      error => {
        this.isLocating = false;
        this.locationStatus = error.code === 1
          ? 'Permissão de localização negada'
          : 'Não foi possível obter sua localização';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }

  loadDashboard(): void {
    this.loading = true;
    this.http.get<Reservoir[]>(`${this.apiUrl}/api/v1/reservoirs`).subscribe({
      next: reservoirs => {
        this.reservoirs = reservoirs
          .filter(reservoir => reservoir.subsystem === 'Sul')
          .slice(0, 8);
      }
    });

    this.loadForecast();

    this.http.get<WeatherObservation[]>(
      `${this.apiUrl}/api/v1/weather/observations`,
      { params: { station_code: 'A801', days: '7' } }
    ).subscribe({
      next: observations => {
        this.weatherObservations = observations;
        this.inmetAvailable = observations.length > 0;
        this.loading = false;
      },
      error: () => {
        this.inmetAvailable = false;
        this.loading = false;
      }
    });
  }

  loadForecast(): void {
    this.loading = true;
    this.http.get<Forecast>(
      `${this.apiUrl}/api/v1/weather/forecast`,
      {
        params: {
          latitude: String(this.selectedCity.latitude),
          longitude: String(this.selectedCity.longitude),
          days: '7',
        },
      }
    ).subscribe({
      next: forecast => {
        this.forecast = forecast;
        this.loading = false;
      },
      error: () => {
        this.forecast = null;
        this.loading = false;
      },
    });
  }

  openAlertSignup(): void {
    this.alertMessage = '';
    this.showAlertSignup = true;
  }

  closeAlertSignup(): void {
    if (!this.alertSubmitting) {
      this.showAlertSignup = false;
      this.alertMessage = '';
    }
  }

  subscribeToAlerts(): void {
    if (!this.alertEmail.trim() && !this.alertPhone.trim()) {
      this.alertMessage = 'Informe um e-mail ou telefone.';
      return;
    }

    this.alertSubmitting = true;
    this.alertMessage = '';
    this.http.post<{ subscribed: boolean; message: string }>(
      `${this.apiUrl}/api/v1/alerts/subscriptions`,
      {
        city: this.selectedCity.name,
        latitude: this.selectedCity.latitude,
        longitude: this.selectedCity.longitude,
        email: this.alertEmail.trim() || null,
        phone: this.alertPhone.trim() || null,
        condition: this.alertCondition,
      }
    ).subscribe({
      next: response => {
        this.alertSubmitting = false;
        this.alertMessage = response.message;
      },
      error: error => {
        this.alertSubmitting = false;
        this.alertMessage =
          error.error?.detail ?? 'Não foi possível concluir a inscrição.';
      },
    });
  }

  get mapUrl(): SafeResourceUrl {
    const latitude = this.selectedCity.latitude;
    const longitude = this.selectedCity.longitude;
    const left = longitude - 0.45;
    const right = longitude + 0.45;
    const bottom = latitude - 0.35;
    const top = latitude + 0.35;
    const url =
      `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${left},${bottom},${right},${top}&layer=mapnik&marker=${latitude},${longitude}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get rainNow(): number {
    return this.forecast?.hourly?.[0]?.precipitation_mm ?? 0;
  }

  get rainProbability(): number {
    return this.forecast?.hourly?.[0]?.precipitation_probability_percent ?? 0;
  }

  get temperature(): number | null {
    return this.forecast?.hourly?.[0]?.temperature_c ?? null;
  }

  get forecastHours(): ForecastHour[] {
    return (this.forecast?.hourly ?? []).slice(0, 12);
  }
}
