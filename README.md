# Tlali Tlapixqui Front

Frontend de Tlali Tlapixqui para visualizar lecturas recientes de sensores y probar el envio de datos al backend.

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

Por defecto consume la API desde el mismo dominio de la aplicación. En
desarrollo puedes cambiarla con `VITE_API_URL=http://localhost:8080`.

## Login

La app incluye:

- Landing publica de presentacion.
- Login por correo y contrasena.
- Boton para Google OAuth.
- Dashboard protegido con JWT.

Usuario inicial de desarrollo:

```text
Correo: nahum.aguilar.per@gmail.com
Password: Admin123!
```

## Build

```powershell
node_modules\.bin\vite.CMD build
```
