package com.v19plus.app;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "V19PlusMainActivity";
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private FrameLayout fullscreenContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Enable Chrome remote debugging (navigate to chrome://inspect in desktop Chrome)
        WebView.setWebContentsDebuggingEnabled(true);

        // 2. Keep screen on during active app lifecycle / video playback
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();

                // Core JavaScript and Storage
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);

                // Media Playback & Streaming: Allow autoplay without requiring explicit user tap
                settings.setMediaPlaybackRequiresUserGesture(false);

                // Allow mixed content for video CDNs, HLS fragment chunks, and thumbnail assets
                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

                // Caching and File Access for fast offline & streaming performance
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                settings.setLoadWithOverviewMode(true);
                settings.setUseWideViewPort(true);

                // Hardware acceleration on the WebView layer
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                webView.setBackgroundColor(0xFF0A0A0A);

                // Setup Fullscreen container for HTML5 <video> fullscreen handling
                setupFullscreenVideoSupport(webView);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring WebView settings", e);
        }
    }

    private void setupFullscreenVideoSupport(WebView webView) {
        fullscreenContainer = new FrameLayout(this);
        fullscreenContainer.setLayoutParams(new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        fullscreenContainer.setBackgroundColor(0xFF000000);
        fullscreenContainer.setVisibility(View.GONE);

        ViewGroup decorView = (ViewGroup) getWindow().getDecorView();
        decorView.addView(fullscreenContainer);
    }
}

