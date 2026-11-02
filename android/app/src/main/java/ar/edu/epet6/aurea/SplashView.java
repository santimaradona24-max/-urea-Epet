package ar.edu.epet6.aurea;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

public final class SplashView extends FrameLayout {
    private final TextView status;

    public SplashView(Activity activity) {
        super(activity);
        String selected = activity.getSharedPreferences("aurea_native", Context.MODE_PRIVATE)
            .getString("theme", "copper");
        int accent;
        int light;
        switch (selected) {
            case "amber": accent = Color.rgb(168, 117, 25); light = Color.rgb(249, 236, 208); break;
            case "jade": accent = Color.rgb(38, 126, 103); light = Color.rgb(222, 242, 234); break;
            case "indigo": accent = Color.rgb(94, 91, 176); light = Color.rgb(236, 234, 250); break;
            default: accent = Color.rgb(185, 92, 43); light = Color.rgb(251, 238, 224); break;
        }
        setBackgroundColor(Color.rgb(250, 247, 240));
        LinearLayout center = new LinearLayout(activity);
        center.setOrientation(LinearLayout.VERTICAL);
        center.setGravity(Gravity.CENTER);
        int inset = dp(activity, 24);
        center.setPadding(inset, inset, inset, inset);

        View gem = new View(activity);
        GradientDrawable gemDrawable = new GradientDrawable(
            GradientDrawable.Orientation.TL_BR, new int[] {Color.WHITE, light, accent});
        gemDrawable.setShape(GradientDrawable.OVAL);
        gemDrawable.setStroke(dp(activity, 1), light);
        gemDrawable.setGradientType(GradientDrawable.RADIAL_GRADIENT);
        gemDrawable.setGradientRadius(dp(activity, 110));
        gem.setBackground(gemDrawable);
        LinearLayout.LayoutParams gemLp = new LinearLayout.LayoutParams(dp(activity, 78), dp(activity, 78));
        gemLp.bottomMargin = dp(activity, 22);
        gem.setLayoutParams(gemLp);
        center.addView(gem);

        TextView brand = new TextView(activity);
        brand.setText("Áurea");
        brand.setTextColor(accent);
        brand.setTextSize(48);
        brand.setTypeface(Typeface.create("serif", Typeface.NORMAL));
        brand.setGravity(Gravity.CENTER);
        center.addView(brand);

        TextView subtitle = new TextView(activity);
        subtitle.setText("CAMPUS ACADÉMICO · EPET N.º 6");
        subtitle.setTextSize(10);
        subtitle.setTextColor(Color.rgb(142, 115, 92));
        subtitle.setLetterSpacing(.12f);
        subtitle.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams subtitleLp = new LinearLayout.LayoutParams(-1, -2);
        subtitleLp.topMargin = dp(activity, 6);
        subtitle.setLayoutParams(subtitleLp);
        center.addView(subtitle);

        ProgressBar indicator = new ProgressBar(activity);
        indicator.setIndeterminate(true);
        indicator.getIndeterminateDrawable().setTint(accent);
        LinearLayout.LayoutParams progressLp = new LinearLayout.LayoutParams(dp(activity, 38), dp(activity, 38));
        progressLp.topMargin = dp(activity, 42);
        indicator.setLayoutParams(progressLp);
        center.addView(indicator);

        status = new TextView(activity);
        status.setText("Comprobando la versión disponible");
        status.setTextSize(12);
        status.setTextColor(Color.rgb(130, 113, 96));
        status.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams statusLp = new LinearLayout.LayoutParams(-1, -2);
        statusLp.topMargin = dp(activity, 12);
        status.setLayoutParams(statusLp);
        center.addView(status);

        FrameLayout.LayoutParams centerLp = new FrameLayout.LayoutParams(-1, -2, Gravity.CENTER);
        addView(center, centerLp);

        TextView footer = new TextView(activity);
        footer.setText("Un solo lugar para aprender y avanzar.");
        footer.setTextSize(11);
        footer.setTextColor(Color.rgb(160, 139, 119));
        footer.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams footerLp = new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM);
        footerLp.bottomMargin = dp(activity, 25);
        footer.setLayoutParams(footerLp);
        addView(footer, footerLp);
    }

    public void status(String message) {
        post(() -> status.setText(message));
    }
    private static int dp(Context c, int value) {
        return Math.round(value * c.getResources().getDisplayMetrics().density);
    }
}
