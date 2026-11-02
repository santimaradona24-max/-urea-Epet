# Áurea — EPET N.º 6

Campus de materias, evaluaciones y calificaciones.

**Web:** https://aurea-epet6.vercel.app/

## Descargas

- Versión estable más reciente: https://github.com/santimaradona24-max/-urea-Epet/releases/latest
- Compilaciones de prueba: https://github.com/santimaradona24-max/-urea-Epet/actions/workflows/build-apps.yml
- Código web: `web/`; Android: `android/`; Windows: `desktop/`.

## Actualizaciones

### Web

Los cambios en los archivos web deben desplegarse en Vercel para aparecer en las aplicaciones. Al abrir Áurea, Android y Windows obtienen la interfaz desde la web. Los controles de pantalla completa se conservan y no se fuerza una recarga durante una evaluación.

### Windows

La aplicación de Windows utiliza `electron-updater` y GitHub Releases. Al iniciar consulta actualizaciones y, cuando hay una nueva versión, la descarga y ofrece instalarla. **Nunca fuerza un reinicio cuando detecta un intento de evaluación en curso.** Para que funcione, los instaladores de Windows necesitan `latest.yml` y `.exe` publicados juntos en una Release.

### Android

La aplicación consulta la última Release pública de GitHub al iniciarse. Si hay una versión posterior, descarga el APK, comprueba tamaño y SHA-256 (cuando GitHub proporciona el digest) y solicita la instalación mediante la interfaz del sistema Android. **La instalación necesita la autorización del usuario** y una **firma permanente coincidente**.

Es obligatorio establecer los cuatro secretos de repositorio en **Settings → Secrets and variables → Actions** antes de publicar un APK actualizable:

- `AUREA_ANDROID_KEYSTORE_B64`: contenido base64 del archivo privado de firma `.jks` (conservá una copia segura).
- `AUREA_ANDROID_STORE_PASSWORD`: contraseña del almacén.
- `AUREA_ANDROID_KEY_ALIAS`: alias de la clave.
- `AUREA_ANDROID_KEY_PASSWORD`: contraseña de la clave.

No subas el archivo `.jks` al repositorio y no reveles las contraseñas en mensajes o archivos públicos.

**La APK de depuración 1.0.0 anterior no tiene una firma recuperable que podamos reutilizar.** Para iniciar la rama actualizable deberás instalar una vez la versión release firmada con esta clave (si hay conflicto de firma, Android te exigirá desinstalar la anterior; respaldá cualquier dato local que necesites).

## Publicar una versión nativa nueva

1. Modificá `desktop/package.json` → `version` y `android/app/build.gradle` → `versionName` con el mismo número (por ejemplo `1.2.0`). Subí también el `versionCode` de Android.
2. Commiteá y subí esos cambios a la rama `main`.
3. `.github/workflows/release-apps.yml` generará el instalador Windows, su manifiesto `latest.yml`, y el APK Android si están configurados los secretos. Publicará una GitHub Release etiquetada `vX.Y.Z`.
4. Los usuarios de las apps que ya incluyen el actualizador recibirán la propuesta de actualización al comprobar esa nueva versión.

Las modificaciones solo web no necesitan nueva Release nativa.

## Limitaciones de verificación

Una compilación exitosa no sustituye pruebas funcionales en dispositivos reales, incluida la evaluación en pantalla completa, instalación real desde Android, cambio entre redes y actualización de Windows.
