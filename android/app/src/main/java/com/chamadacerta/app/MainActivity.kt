package com.chamadacerta.app

import android.Manifest
import android.app.Activity
import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.database.ContentObserver
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewFeature
import com.chamadacerta.app.bridge.AndroidBridge
import com.chamadacerta.app.bridge.BridgeContract
import com.chamadacerta.app.bridge.LocalWebView
import com.chamadacerta.app.bridge.PermissionCoordinator
import com.chamadacerta.app.calls.PhoneCallService
import com.chamadacerta.app.data.DeviceStatusReader
import com.chamadacerta.app.data.ProtectionPreferences
import com.chamadacerta.app.domain.DialNumber
import java.util.UUID
import org.json.JSONObject

class MainActivity : Activity() {
    private var pendingDialId: String? = null
    private var pendingDialNumber: String? = null
    private var webView: WebView? = null
    private var bridge: AndroidBridge? = null
    private lateinit var permissionCoordinator: PermissionCoordinator
    private var receiverRegistered = false
    private val observer =
        object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) = notifyRefresh()
        }
    private val updates =
        object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) = notifyRefresh()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingDialNumber = savedInstanceState?.getString("pending_dial_number")
        pendingDialId = savedInstanceState?.getString("pending_dial_id")
        if (savedInstanceState == null) captureDialIntent(intent)
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            showUnsupportedWebView()
            return
        }
        val preferences = ProtectionPreferences(this)
        val status = DeviceStatusReader(this, preferences)
        permissionCoordinator = PermissionCoordinator(this, status)
        val page = LocalWebView.create(this, ::notifyRefresh)
        webView = page
        bridge =
            AndroidBridge(this, permissionCoordinator, status, preferences, ::getDialRequest).also {
                it.attach(page)
            }
        setContentView(page)
        page.loadUrl(BridgeContract.ENTRY_URL)
        val filter =
            IntentFilter(BridgeContract.callsChangedAction(packageName)).apply {
                addAction(PhoneCallService.STATE_CHANGED)
            }
        ContextCompat.registerReceiver(this, updates, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
        receiverRegistered = true
    }

    private fun captureDialIntent(incoming: Intent?) {
        if (incoming?.action != Intent.ACTION_DIAL && incoming?.action != Intent.ACTION_VIEW) return
        if (incoming.data != null && incoming.data?.scheme != "tel") return
        pendingDialId = UUID.randomUUID().toString()
        pendingDialNumber =
            incoming.data?.schemeSpecificPart?.let { DialNumber.parse(it) }.orEmpty()
    }

    private fun getDialRequest(): JSONObject =
        JSONObject()
            .put("id", pendingDialId ?: JSONObject.NULL)
            .put("number", pendingDialNumber ?: JSONObject.NULL)

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        captureDialIntent(intent)
        notifyRefresh()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        outState.putString("pending_dial_id", pendingDialId)
        outState.putString("pending_dial_number", pendingDialNumber)
        super.onSaveInstanceState(outState)
    }

    override fun onResume() {
        super.onResume()
        if (webView == null) return
        observeGrantedProviders()
        notifyRefresh()
    }

    private fun observeGrantedProviders() {
        contentResolver.unregisterContentObserver(observer)
        if (
            checkSelfPermission(Manifest.permission.READ_CONTACTS) ==
                PackageManager.PERMISSION_GRANTED
        ) {
            runCatching {
                contentResolver.registerContentObserver(
                    Uri.parse("content://com.android.contacts"),
                    true,
                    observer,
                )
            }
        }
        if (
            checkSelfPermission(Manifest.permission.READ_CALL_LOG) ==
                PackageManager.PERMISSION_GRANTED
        ) {
            runCatching {
                contentResolver.registerContentObserver(
                    android.provider.CallLog.Calls.CONTENT_URI,
                    true,
                    observer,
                )
            }
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (::permissionCoordinator.isInitialized) permissionCoordinator.complete(requestCode)
        observeGrantedProviders()
        notifyRefresh()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (::permissionCoordinator.isInitialized) permissionCoordinator.complete(requestCode)
        notifyRefresh()
    }

    private fun notifyRefresh() {
        val page = webView ?: return
        page.post {
            if (!isFinishing && !isDestroyed)
                page.evaluateJavascript(
                    "window.dispatchEvent(new Event('${BridgeContract.REFRESH_EVENT}'));" +
                        "window.dispatchEvent(new Event('${BridgeContract.DIAL_REQUEST_EVENT}'))",
                    null,
                )
        }
    }

    private fun showUnsupportedWebView() {
        AlertDialog.Builder(this)
            .setTitle("Atualize o Android System WebView")
            .setMessage(
                "O aplicativo precisa de uma versão atualizada do WebView para acessar " +
                    "os recursos do aparelho com segurança."
            )
            .setPositiveButton("Fechar") { _, _ -> finish() }
            .setCancelable(false)
            .show()
    }

    override fun onDestroy() {
        if (receiverRegistered) unregisterReceiver(updates)
        contentResolver.unregisterContentObserver(observer)
        bridge?.close()
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}
