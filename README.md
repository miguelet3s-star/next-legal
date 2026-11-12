# Next Legal · Prototipo

**El abogado que usted necesita, a un toque de distancia.** Tecnología legal hecha en Honduras.

Prototipo navegable de la página de lanzamiento y de la app de Next Legal.

- **Sitio publicado:** https://miguelet3s-star.github.io/next-legal/
- **Inicio de sesión:** https://miguelet3s-star.github.io/next-legal/entrar
- **Vista previa del correo de bienvenida:** https://miguelet3s-star.github.io/next-legal/correo
- **Versión “ya lanzada”** (el botón pasa a *Iniciar sesión*): agregue `?lanzado=1` a la dirección.

## Ejecutar en local
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas
npm run build      # compilación de producción
```

## Publicar en GitHub Pages
```bash
npm run deploy     # compila con base /next-legal/ y publica en la rama gh-pages
```

## Datos provisionales
- Fecha de lanzamiento y lista de espera: `src/lib/launch.ts` (`LAUNCH_DATE`, `WAITLIST_BASE`).
- Tras cambiar la fecha, regenerar la cuenta regresiva del correo: `npm run email:gif`.
- Los registros del kiosko se guardan solo en el dispositivo; se exportan desde `/kiosko/registros`.

## Stack
React + Vite + TypeScript, preparado como PWA para empaquetarse en Android e iOS con Capacitor.

Imágenes con fines ilustrativos. Créditos de fotografías en `public/img/CREDITOS.txt` y de logos en `public/aliados/LEEME.txt`.
