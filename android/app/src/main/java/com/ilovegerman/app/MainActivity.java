package com.ilovegerman.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private int fixedContentHeight = 0;

    @Override
    protected void onCreate(android.os.Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Window transparency settings
        android.view.Window window = getWindow();
        window.setSoftInputMode(
                android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);

        // Make window background transparent (floating window from theme)
        window.setBackgroundDrawable(
                new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));

        // Make decor view transparent
        window.getDecorView().setBackgroundColor(android.graphics.Color.TRANSPARENT);

        // Setup dismiss area after Capacitor initializes
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            setupDismissArea();
        }, 100);

        handleIntent(getIntent(), true);
    }

    private void setupDismissArea() {
        try {
            // Get usable screen dimensions
            android.util.DisplayMetrics displayMetrics = new android.util.DisplayMetrics();
            getWindowManager().getDefaultDisplay().getMetrics(displayMetrics);
            int screenHeight = displayMetrics.heightPixels;

            // 85% content, 15% dismiss area
            fixedContentHeight = (int) (screenHeight * 0.85);
            int dismissAreaHeight = screenHeight - fixedContentHeight;

            // Get root content and make transparent
            android.widget.FrameLayout rootContent = (android.widget.FrameLayout) findViewById(android.R.id.content);
            rootContent.setBackgroundColor(android.graphics.Color.TRANSPARENT);

            // Make all parent views transparent
            android.view.ViewParent parent = rootContent.getParent();
            while (parent != null && parent instanceof android.view.View) {
                android.view.View parentView = (android.view.View) parent;
                parentView.setBackgroundColor(android.graphics.Color.TRANSPARENT);
                parent = parentView.getParent();
            }

            // Make DecorView transparent
            getWindow().getDecorView().setBackgroundColor(android.graphics.Color.TRANSPARENT);

            if (rootContent != null && rootContent.getChildCount() > 0) {
                // Get Capacitor view
                android.view.View capacitorView = rootContent.getChildAt(0);

                // Set content to 85% height with rounded corners (no border)
                android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
                background.setColor(android.graphics.Color.parseColor("#FAFAFA"));
                background.setCornerRadius(40f); // Rounded corners (~20dp)
                // NO stroke/border
                capacitorView.setBackground(background);
                capacitorView.setClipToOutline(true); // Clip content to rounded corners

                android.widget.FrameLayout.LayoutParams capacitorParams = new android.widget.FrameLayout.LayoutParams(
                        android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                        fixedContentHeight);
                capacitorParams.gravity = android.view.Gravity.TOP;
                capacitorView.setLayoutParams(capacitorParams);

                // Create semi-transparent dismiss touch area at bottom
                android.view.View dismissArea = new android.view.View(this);
                dismissArea.setBackgroundColor(android.graphics.Color.parseColor("#80000000")); // 50% black

                android.widget.FrameLayout.LayoutParams dismissParams = new android.widget.FrameLayout.LayoutParams(
                        android.widget.FrameLayout.LayoutParams.MATCH_PARENT,
                        dismissAreaHeight);
                dismissParams.gravity = android.view.Gravity.BOTTOM;
                dismissArea.setLayoutParams(dismissParams);
                dismissArea.setClickable(true);
                dismissArea.setFocusable(true);

                dismissArea.setOnClickListener(v -> {
                    finish();
                });

                rootContent.addView(dismissArea);
            }
        } catch (Exception e) {
            android.util.Log.e("MainActivity", "Error: " + e.getMessage());
        }
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent, false);
    }

    private void handleIntent(android.content.Intent intent, boolean isColdStart) {
        if (intent == null)
            return;

        String action = intent.getAction();
        String type = intent.getType();

        if (android.content.Intent.ACTION_SEND.equals(action) && type != null) {
            if ("text/plain".equals(type)) {
                String sharedText = intent.getStringExtra(android.content.Intent.EXTRA_TEXT);
                sendToJS(sharedText, isColdStart);
            }
        } else if (android.content.Intent.ACTION_PROCESS_TEXT.equals(action)) {
            String sharedText = intent.getStringExtra(android.content.Intent.EXTRA_PROCESS_TEXT);
            sendToJS(sharedText, isColdStart);
        }
    }

    private void sendToJS(String text, boolean isColdStart) {
        if (text != null && !text.isEmpty()) {
            String cleanedText = cleanSharedText(text);
            if (cleanedText != null) {
                long delay = isColdStart ? 1500 : 100;

                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    triggerJSEvent(cleanedText);
                }, delay);
            }
        }
    }

    private void triggerJSEvent(String cleanedText) {
        if (bridge != null) {
            String json = "{ \"extras\": { \"android.intent.extra.TEXT\": \"" + escapeJS(cleanedText) + "\" } }";
            bridge.triggerWindowJSEvent("customShareEvent", json);
        } else {
            android.util.Log.e("MainActivity", "Bridge is null");
        }
    }

    private String cleanSharedText(String rawText) {
        if (rawText == null || rawText.isEmpty()) {
            return null;
        }
        String cleanedText = rawText;
        try {
            java.util.regex.Pattern urlPattern = java.util.regex.Pattern.compile("https?://[^\\s]+",
                    java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher urlMatcher = urlPattern.matcher(cleanedText);
            cleanedText = urlMatcher.replaceAll("");

            if (cleanedText.contains("%")) {
                cleanedText = java.net.URLDecoder.decode(cleanedText, "UTF-8");
            }
        } catch (Exception e) {
            // Ignore
        }
        cleanedText = cleanedText.replaceAll("\\s+", " ").trim();
        if (cleanedText.startsWith("\"") && cleanedText.endsWith("\"") && cleanedText.length() > 2) {
            cleanedText = cleanedText.substring(1, cleanedText.length() - 1).trim();
        }
        return cleanedText.isEmpty() ? null : cleanedText;
    }

    private String escapeJS(String text) {
        if (text == null)
            return "";
        return text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
