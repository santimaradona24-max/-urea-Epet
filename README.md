# Áurea — EPET N.º 6

Plataforma escolar de materias, usuarios, evaluaciones y calificaciones.

**Web:** https://aurea-epet6.vercel.app/

## Carpetas
- `web/`: archivos públicos recuperados de la versión desplegada en Vercel el 2 de noviembre de 2026.
- `android/`: app Android WebView que utiliza la versión HTTPS.
- `desktop/`: app Windows con Electron y aislamiento de procesos.
- `.github/workflows/build-apps.yml`: compilación automática Android/Windows.

## Descargar instaladores
GitHub → **Actions** → **Compilar Áurea para Android y Windows** → ejecución exitosa → **Artifacts**.

La app requiere conexión a Internet y utiliza el servicio Supabase existente. El APK de prueba está firmado con la clave de depuración de Android. El instalador de Windows no incluye firma comercial.

La compilación no implica que las funcionalidades académicas o los controles de integridad estén completamente auditados. Los envoltorios nativos no sustituyen las comprobaciones del backend.
