package ar.edu.epet6.aurea;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

public final class UpdateManager {
    private static final String RELEASE_API =
        "https://api.github.com/repos/santimaradona24-max/-urea-Epet/releases/latest";
    private static final String RELEASE_PREFIX =
        "https://github.com/santimaradona24-max/-urea-Epet/releases/download/";
    private final Activity activity;
    private final SplashView splash;
    private final Runnable openApp;
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile boolean complete = false;

    public UpdateManager(Activity activity, SplashView splash, Runnable openApp) {
        this.activity = activity; this.splash = splash; this.openApp = openApp;
    }
    private void finish() {
        main.post(() -> {
            if (complete || activity.isFinishing()) return;
            complete = true;
            openApp.run();
        });
    }

    public void checkAtStartup() {
        Thread thread = new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                conn = (HttpURLConnection) new URL(RELEASE_API).openConnection();
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(3500);
                conn.setRequestProperty("Accept", "application/vnd.github+json");
                conn.setRequestProperty("User-Agent", "Aurea-Android-Updater");
                if (conn.getResponseCode() != 200) { finish(); return; }
                String raw = readText(conn.getInputStream(), 150000);
                JSONObject release = new JSONObject(raw);
                String tag = release.optString("tag_name", "");
                if (!isNewer(tag)) { finish(); return; }
                JSONArray assets = release.optJSONArray("assets");
                if (assets == null) { finish(); return; }
                JSONObject apk = null;
                for (int i = 0; i < assets.length(); i++) {
                    JSONObject item = assets.optJSONObject(i);
                    if (item != null && item.optString("name", "").matches("Aurea-Android-v[0-9.]+\\.apk")) {
                        apk = item; break;
                    }
                }
                if (apk == null) { finish(); return; }
                String url = apk.optString("browser_download_url", "");
                if (!url.startsWith(RELEASE_PREFIX)) { finish(); return; }
                String digest = apk.optString("digest", "");
                long size = apk.optLong("size", 0);
                if (size <= 0 || size > 100L * 1024 * 1024) { finish(); return; }
                final String version = tag;
                final String assetUrl = url;
                final String sha = digest.startsWith("sha256:") ? digest.substring(7) : "";
                final long expectedSize = size;
                main.post(() -> {
                    if (activity.isFinishing()) { finish(); return; }
                    splash.status("Nueva versión " + version + " disponible");
                    new AlertDialog.Builder(activity)
                      .setTitle("Actualización de Áurea")
                      .setMessage("Está disponible la versión " + version +
                         ". ¿Querés descargarla e instalarla? Android te pedirá confirmar la instalación.")
                      .setPositiveButton("Actualizar", (d, w) -> download(assetUrl, sha, expectedSize))
                      .setNegativeButton("Ahora no", (d, w) -> finish())
                      .setOnCancelListener(d -> finish())
                      .show();
                });
            } catch (Exception ignored) {
                finish();
            } finally {
                if (conn != null) conn.disconnect();
            }
        }, "aurea-native-update-check");
        thread.setDaemon(true);
        thread.start();
    }

    private boolean isNewer(String tag) {
        try {
            String candidate = tag.replaceFirst("^v", "");
            String current = activity.getPackageManager()
                .getPackageInfo(activity.getPackageName(), 0).versionName;
            String[] a = candidate.split("\\.");
            String[] b = current.split("\\.");
            for (int i = 0; i < 3; i++) {
                int ai = i < a.length ? Integer.parseInt(a[i]) : 0;
                int bi = i < b.length ? Integer.parseInt(b[i]) : 0;
                if (ai != bi) return ai > bi;
            }
        } catch (Exception ignored) { }
        return false;
    }
    private static String readText(InputStream in, int max) throws Exception {
        try (InputStream stream = in) {
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[8192]; int n;
            while ((n = stream.read(buf)) != -1) {
                if (out.size() + n > max) throw new Exception("Response too large");
                out.write(buf, 0, n);
            }
            return out.toString("UTF-8");
        }
    }

    private void download(String remote, String expectedSha, long expectedSize) {
        splash.status("Descargando actualización verificada...");
        Thread worker = new Thread(() -> {
            HttpURLConnection conn = null;
            File temp = new File(activity.getCacheDir(), "aurea-native-update.apk.part");
            File target = new File(activity.getCacheDir(), "aurea-native-update.apk");
            try {
                conn = (HttpURLConnection) new URL(remote).openConnection();
                conn.setConnectTimeout(10000); conn.setReadTimeout(15000);
                conn.setInstanceFollowRedirects(true);
                if (conn.getResponseCode() != 200) throw new Exception("Error de descarga");
                MessageDigest hash = MessageDigest.getInstance("SHA-256");
                long downloaded = 0;
                try (InputStream in = conn.getInputStream();
                     FileOutputStream out = new FileOutputStream(temp)) {
                    byte[] buf = new byte[32768]; int n;
                    while ((n = in.read(buf)) != -1) {
                        downloaded += n;
                        if (downloaded > 100L * 1024 * 1024) throw new Exception("Archivo demasiado grande");
                        out.write(buf, 0, n); hash.update(buf, 0, n);
                    }
                }
                if (downloaded != expectedSize) throw new Exception("Tamaño incorrecto");
                if (!expectedSha.isEmpty()) {
                    StringBuilder actual = new StringBuilder();
                    for (byte b : hash.digest()) actual.append(String.format("%02x", b & 255));
                    if (!expectedSha.equalsIgnoreCase(actual.toString())) throw new Exception("Integridad incorrecta");
                }
                if (target.exists() && !target.delete()) throw new Exception("No se pudo preparar el archivo");
                if (!temp.renameTo(target)) throw new Exception("No se pudo finalizar la descarga");
                main.post(() -> install(target));
            } catch (Exception error) {
                temp.delete();
                main.post(() -> new AlertDialog.Builder(activity)
                  .setTitle("No se pudo actualizar")
                  .setMessage("La actualización no se instaló. " + error.getMessage() +
                      ". Podés seguir usando la versión actual.")
                  .setPositiveButton("Continuar", (d, w) -> finish())
                  .setOnCancelListener(d -> finish())
                  .show());
            } finally { if (conn != null) conn.disconnect(); }
        }, "aurea-native-update-download");
        worker.setDaemon(true); worker.start();
    }

    private void install(File apk) {
        if (Build.VERSION.SDK_INT >= 26 && !activity.getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(activity)
                .setTitle("Permitir la actualización")
                .setMessage("Android necesita que autorices a Áurea a instalar su actualización.")
                .setPositiveButton("Abrir ajustes", (d, w) -> {
                    Intent settings = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + activity.getPackageName()));
                    try { activity.startActivity(settings); }
                    catch (ActivityNotFoundException e) { }
                    finish();
                })
                .setNegativeButton("Más tarde", (d, w) -> finish())
                .show();
            return;
        }
        try {
            Uri uri = FileProvider.getUriForFile(activity,
                activity.getPackageName() + ".fileprovider", apk);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(intent);
            finish();
        } catch (Exception e) {
            new AlertDialog.Builder(activity)
                .setTitle("No se pudo abrir el instalador")
                .setMessage("Podés continuar usando Áurea y volver a intentar más tarde.")
                .setPositiveButton("Continuar", (d, w) -> finish())
                .show();
        }
    }
}
