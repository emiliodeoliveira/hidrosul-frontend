import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map, of } from 'rxjs';
import { environment } from '../environments/environment';

interface HydrosulObservation {
  station_code?: string | number;
  horEstacao?: number;
  timestamp?: string;
  date?: string;
  horDataHora?: string;
  level_m?: number;
  horNivelAdotado?: number;
}

@Injectable({
  providedIn: 'root'
})

export class HidrowebService {
  private http = inject(HttpClient)
  private platformId = inject(PLATFORM_ID);
  private apiUrl = environment.apiUrl.replace(/\/$/, '');

  constructor() {}

  guaibaData() {
    return this.stationData('87242000');
  }

  cidadeGuaibaData() {
    return this.stationData('87242000');
  }

  campoBomData() {
    return this.stationData('87380000');
  }

  saoLeopoldoBomData() {
    return this.stationData('87382000');
  }

  private stationData(stationCode: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return of([]);
    }

    return this.http
      .get<HydrosulObservation[] | { observations: HydrosulObservation[] }>(
        `${this.apiUrl}/api/v1/stations/${stationCode}/observations`,
        { params: { days: '7' } }
      )
      .pipe(map(response => this.normalizeObservations(response)));
  }

  private normalizeObservations(
    response: HydrosulObservation[] | { observations: HydrosulObservation[] }
  ) {
    const observations = Array.isArray(response) ? response : response.observations ?? [];

    return observations
      .map(observation => {
        const timestamp = observation.timestamp ?? observation.date ?? observation.horDataHora;
        const levelMeters = observation.level_m ??
          (observation.horNivelAdotado !== undefined
            ? observation.horNivelAdotado / 100
            : undefined);
        const stationCode = observation.station_code ?? observation.horEstacao;

        if (!timestamp || levelMeters === undefined) {
          return null;
        }

        return {
          horDataHora: timestamp,
          horNivelAdotado: levelMeters * 100,
          horEstacao: typeof stationCode === 'string' ? Number(stationCode) : (stationCode ?? 0)
        };
      })
      .filter((observation): observation is {
        horDataHora: string;
        horNivelAdotado: number;
        horEstacao: number;
      } => observation !== null);
  }
}