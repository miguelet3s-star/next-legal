# Next Legal · Prototipo

**El abogado que usted necesita, a un toque de distancia.** Tecnología legal hecha en Honduras.

Prototipo navegable de la página de lanzamiento y de la app de Next Legal.

- **Sitio publicado:** https://nextlegalhn.github.io/
- **Inicio de sesión:** https://nextlegalhn.github.io/entrar
- **Vista previa del correo de bienvenida:** https://nextlegalhn.github.io/correo
- **Versión “ya lanzada”** (el botón pasa a *Iniciar sesión*): agregue `?lanzado=1` a la dirección.

## Las dos áreas de la app
Al iniciar sesión se elige el tipo de cuenta y cada una abre su propia área. No se cruzan: quien entra a una ruta de la otra área vuelve a su inicio, y sin sesión se va a `/entrar` (reglas en `src/lib/session.ts`).

- **Cliente** (`/inicio`, `/buscar`, `/abogado/:id`, `/agendar/:id`, `/casos`, `/consultas`, `/documentos`, `/pagos`, `/mensajes`, `/perfil`).
- **Abogado** (`/despacho`, `/despacho/agenda`, `/despacho/casos`, `/despacho/clientes`, `/despacho/mensajes`, `/despacho/ingresos`, `/despacho/perfil`).

Las dos áreas comparten los mismos datos (`src/lib/db.ts`): lo que el cliente agenda le llega al abogado, y cada avance que el abogado registra aparece en el caso del cliente. Cada pantalla recibe solo las filas de quien tiene la sesión (`scopeDb`). En el prototipo los datos y la sesión viven en el dispositivo; el pago es de muestra y los archivos subidos no se conservan al cerrar.

## Ejecutar en local
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas
npm run build      # compilación de producción
```

## Publicar en GitHub Pages
```bash
npm run deploy     # compila con base / y publica en la organización NextLegalHN en la rama gh-pages
```

## Datos provisionales
- Fecha de lanzamiento y lista de espera: `src/lib/launch.ts` (`LAUNCH_DATE`, `WAITLIST_BASE`).
- Tras cambiar la fecha, regenerar la cuenta regresiva del correo: `npm run email:gif`.
- Videos del logo en bucle para pantallas, en horizontal (1920×1080) y vertical (1080×1920): `npm run marca:videos` los deja en `marca/stand/`.
- Videos del stand (la app real manejándose sola, con «Muy pronto» y QR): `npm run stand:videos` graba los seis en `marca/stand/` (tarda unos 10 minutos y necesita Google Chrome). La dirección del QR está en `scripts/stand/escena.js` (`WEB`); si cambia, hay que volver a grabar.
- Los registros del kiosko se guardan solo en el dispositivo; se exportan desde `/kiosko/registros`.

## Stack
React + Vite + TypeScript, preparado como PWA para empaquetarse en Android e iOS con Capacitor.

Imágenes con fines ilustrativos. Créditos de fotografías en `public/img/CREDITOS.txt` y de logos en `public/aliados/LEEME.txt`.
