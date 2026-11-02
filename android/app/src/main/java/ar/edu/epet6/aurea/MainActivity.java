package ar.edu.epet6.aurea;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ValueCallback;

public class MainActivity extends Activity {
    private static final String HOME = "https://aurea-epet6.vercel.app/";
    private static final String HOST = "aurea-epet6.vercel.app";
    private static final int PICK_FILE = 901;
    private WebView webView;
    private UpdateManager updateManager;
    private SplashView splashView;
    private ValueCallback<Uri[]> chosenFiles;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;

    private boolean internal(Uri uri) {
        return uri != null && "https".equalsIgnoreCase(uri.getScheme())
            && HOST.equalsIgnoreCase(uri.getHost());
    }
    private void openOutside(Uri uri) {
        if (uri == null) return;
        String scheme = uri.getScheme();
        if (!"https".equalsIgnoreCase(scheme)
            && !"mailto".equalsIgnoreCase(scheme)
            && !"tel".equalsIgnoreCase(scheme)) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) { }
    }

    @Override @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(249, 245, 236));
        getWindow().setNavigationBarColor(Color.rgb(249, 245, 236));
        if (Build.VERSION.SDK_INT >= 26) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(249, 245, 236));
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                if (internal(Uri.parse(url))) {
                    view.evaluateJavascript("localStorage.getItem('aurea_theme_last')", result -> {
                        String theme = result == null ? "" : result.replace("\\\"", "").trim();
                        if (theme.matches("copper|amber|jade|indigo")) {
                            getSharedPreferences("aurea_native", MODE_PRIVATE).edit()
                                .putString("theme", theme).apply();
                        }
                    });
                }
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                if (internal(request.getUrl())) return false;
                openOutside(request.getUrl());
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams parameters) {
                if (chosenFiles != null) chosenFiles.onReceiveValue(null);
                chosenFiles = callback;
                try {
                    startActivityForResult(parameters.createIntent(), PICK_FILE);
                } catch (Exception e) {
                    chosenFiles = null;
                    callback.onReceiveValue(null);
                }
                return true;
            }
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullscreenView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                fullscreenView = view;
                fullscreenCallback = callback;
                webView.setVisibility(View.GONE);
                ViewGroup root = (ViewGroup) getWindow().getDecorView();
                root.addView(view, new ViewGroup.LayoutParams(-1, -1));
            }
            @Override
            public void onHideCustomView() {
                if (fullscreenView == null) return;
                ViewGroup root = (ViewGroup) getWindow().getDecorView();
                root.removeView(fullscreenView);
                fullscreenView = null;
                webView.setVisibility(View.VISIBLE);
                if (fullscreenCallback != null) fullscreenCallback.onCustomViewHidden();
                fullscreenCallback = null;
            }
        });
        final boolean restored = state != null && webView.restoreState(state) != null;
        if (restored) {
            setContentView(webView);
        } else {
            splashView = new SplashView(this);
            setContentView(splashView);
            updateManager = new UpdateManager(this, splashView, () -> {
                if (!isFinishing() && !isDestroyed()) {
                    splashView = null;
                    setContentView(webView);
                    webView.loadUrl(HOME);
                }
            });
            updateManager.checkAtStartup();
        }
    }
    @Override
    protected void onSaveInstanceState(Bundle out) {
        webView.saveState(out);
        super.onSaveInstanceState(out);
    }
    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILE && chosenFiles != null) {
            chosenFiles.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            chosenFiles = null;
        }
    }
    @Override @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (fullscreenView != null) {
            webView.getWebChromeClient().onHideCustomView();
        } else if (webView.canGoBack()) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                .setTitle("Cerrar Áurea")
                .setMessage("Si estás rindiendo una evaluación, salir puede reiniciar tu intento.")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Salir", (dialog, which) -> finish())
                .show();
        }
    }
    @Override protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }
    @Override protected void onDestroy() {
        if (chosenFiles != null) chosenFiles.onReceiveValue(null);
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
