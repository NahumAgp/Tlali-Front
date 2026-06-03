# Tlali-Front

Frontend de Tlali para visualizar lecturas recientes del invernadero y probar el envio de datos al backend.

## Stack

- React
- Vite
- Tailwind CSS
- pnpm

## Instalar

```powershell
npx --yes pnpm@10 install
```

## Ejecutar

```powershell
node_modules\.bin\vite.CMD --host 127.0.0.1
```

Por defecto consume `http://localhost:8080`. Puedes cambiarlo con `VITE_API_URL`.

## Login

La app incluye:

- Landing publica de presentacion.
- Login por correo y contrasena.
- Boton para Google OAuth.
- Dashboard protegido con JWT.

Usuario inicial de desarrollo:

```text
Correo: superadmin@tlali.local
Password: SuperAdmin123!
```

## Build

```powershell
node_modules\.bin\vite.CMD build
```
