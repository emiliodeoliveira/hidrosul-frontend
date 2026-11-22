# HidroSul

Painel hidrológico para monitorar o Guaíba e outras bacias do Rio Grande do Sul.

## Arquitetura

O frontend desta aplicação é um Angular 17 responsável pelos dashboards e pela experiência do usuário.

- Os dados públicos de ANA, HidroWeb e sala de situação são consumidos por uma API backend em Python.
- O backend deve normalizar observações, persistir histórico, avaliar regras e publicar alarmes.
- Este repositório não deve chamar diretamente os provedores públicos.
- Comunicação recomendada: REST/JSON ou GraphQL para consultas e WebSocket/SSE para atualizações.
- Mensageria recomendada para alarmes: RabbitMQ/AMQP ou Azure Service Bus; para notificações simples, filas de e-mail/SMS/push.

## Configuração da API

Defina a URL do backend em `src/environments/environment.ts` e `src/environments/environment.development.ts`.

```ts
apiUrl: 'http://localhost:8000'
```

O frontend espera o contrato:

- `GET /api/v1/stations/{station_code}/observations?days=7`
- resposta: um array de objetos normalizados:

```json
[
  {
    "station_code": "87242000",
    "timestamp": "2026-11-17T21:00:00-03:00",
    "level_m": 2.14
  }
]
```

## Fontes disponíveis

- Open-Meteo: previsão meteorológica e precipitação sem chave.
- ONS: dados públicos de reservatórios em arquivos CSV, XLSX e Parquet.
- INMET: observações meteorológicas públicas por estação.

ANA/HidroWeb e Sala de Situação do RS estão desativadas até haver autenticação ou uma fonte fluvial alternativa confirmada.
ONS, INMET e Open-Meteo não substituem diretamente os níveis fluviais do Guaíba e dos rios dos Sinos.

## Desenvolvimento

```bash
npm install
npm start
```

## Build

```bash
npm run build
```

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
