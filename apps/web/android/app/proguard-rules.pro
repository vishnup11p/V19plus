# Preserve line numbers for crash reporting and stack traces
-keepattributes SourceFile,LineNumberTable,*Annotation*
-renamesourcefileattribute SourceFile

# Capacitor Core & Plugin Bridge Rules
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
    @com.getcapacitor.annotation.CapacitorPlugin public *;
}

# Android WebView JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Google Sign-In, Firebase, and API client rules
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.google.api.client.** { *; }

