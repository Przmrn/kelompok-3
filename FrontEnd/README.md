# FrontEnd

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Jalankan backend dari folder `BackEnd` dengan `dotnet run --launch-profile http` setelah koneksi PostgreSQL dan pengaturan JWT tersedia. Dari folder `FrontEnd`, jalankan `npm start` lalu buka `http://localhost:4200`. Angular meneruskan permintaan `/api` ke backend di port 5035 melalui `proxy.conf.json`.

Untuk deployment, arahkan `/api/` pada domain frontend ke layanan backend melalui reverse proxy. Gunakan HTTPS untuk halaman dan API autentikasi.

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
