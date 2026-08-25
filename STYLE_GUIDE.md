# Sistema visual Tlali

La fuente de verdad del tema está en `src/styles/tlali-theme.css`. Tailwind CSS v4
descubre estos tokens mediante `@theme`, por lo que pueden utilizarse directamente
desde JSX.

## Paleta

| Token Tailwind | Uso |
| --- | --- |
| `tlali-cream` | Fondo principal cálido |
| `tlali-paper` | Tarjetas y superficies |
| `tlali-ink` | Texto y fondos de alto contraste |
| `tlali-jade` | Datos, estados y acentos tecnológicos |
| `tlali-jade-dark` | Botones principales y encabezados |
| `tlali-red` | Alertas, llamados y acentos culturales |
| `tlali-earth` | Detalles de tierra y apoyo |
| `tlali-muted` | Texto secundario |
| `tlali-line` | Bordes y separadores |

Ejemplo: `className="bg-tlali-cream text-tlali-ink border-tlali-line"`.

## Plantilla de página

```jsx
function NuevaPagina() {
  return (
    <main className="tlali-page min-h-screen text-tlali-ink">
      <section className="tlali-section">
        <div className="tlali-container">
          <p className="eyebrow">Sección</p>
          <h1 className="font-display mt-3 text-4xl font-bold">Título</h1>
          <article className="tlali-card mt-8 p-6">Contenido</article>
        </div>
      </section>
    </main>
  )
}
```

## Componentes base

- `tlali-page`: fondo crema con retícula sutil.
- `tlali-container`: ancho y márgenes responsive.
- `tlali-section`: espaciado vertical uniforme.
- `tlali-card`: superficie estándar.
- `tlali-frame`: marco destacado para imágenes.
- `tlali-input`: campos de formulario.
- `primary-button` y `secondary-button`: acciones principales y secundarias.
- `font-display`: tipografía editorial para títulos.

Los estados operativos deben reservar jade para normal/online, ámbar para atención
y rojo Tlali para alertas o acciones críticas.
