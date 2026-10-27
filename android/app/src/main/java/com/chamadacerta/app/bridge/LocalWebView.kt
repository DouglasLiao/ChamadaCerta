package com.chamadacerta.app.bridge

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.view.WindowInsets
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

object LocalWebView {
    private const val CONTENT_POLICY =
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
            "connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"

    @SuppressLint("SetJavaScriptEnabled")
    fun create(activity: Activity, onPageReady: () -> Unit): WebView {
        val loader =
            WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(activity))
                .build()
        return WebView(activity).apply {
            setBackgroundColor(Color.rgb(16, 19, 22))
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = false
                textZoom = (activity.resources.configuration.fontScale * 100).toInt()
                allowFileAccess = false
                allowContentAccess = false
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                setSupportMultipleWindows(false)
                javaScriptCanOpenWindowsAutomatically = false
            }
            webViewClient =
                object : WebViewClient() {
                    override fun shouldInterceptRequest(
                        view: WebView,
                        request: WebResourceRequest,
                    ): WebResourceResponse {
                        val uri = request.url
                        if (
                            request.method != "GET" ||
                                uri.scheme != "https" ||
                                uri.host != "appassets.androidplatform.net"
                        )
                            return denied()
                        val response =
                            if (uri.path == "/app" || uri.path == "/") {
                                WebResourceResponse(
                                    "text/html",
                                    "utf-8",
                                    activity.assets.open("web/index.html"),
                                )
                            } else {
                                loader.shouldInterceptRequest(
                                    Uri.parse(BridgeContract.ORIGIN + "/assets/web" + uri.path)
                                ) ?: denied()
                            }
                        response.responseHeaders =
                            (response.responseHeaders ?: emptyMap()) +
                                mapOf(
                                    "Content-Security-Policy" to CONTENT_POLICY,
                                    "X-Content-Type-Options" to "nosniff",
                                    "Cache-Control" to "no-store",
                                )
                        return response
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView,
                        request: WebResourceRequest,
                    ) = request.url.toString() != BridgeContract.ENTRY_URL

                    override fun onPageFinished(view: WebView, url: String) = onPageReady()
                }
            setOnApplyWindowInsetsListener { view, insets ->
                if (Build.VERSION.SDK_INT >= 30) {
                    val bars =
                        insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.ime())
                    view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                }
                insets
            }
        }
    }

    private fun denied() =
        WebResourceResponse(
            "text/plain",
            "utf-8",
            403,
            "Forbidden",
            emptyMap(),
            "".byteInputStream(),
        )
}
