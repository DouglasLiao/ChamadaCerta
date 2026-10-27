package com.chamadacerta.app.bridge

import android.Manifest
import android.app.Activity
import android.os.Build
import android.webkit.WebView
import androidx.webkit.WebViewCompat
import com.chamadacerta.app.data.CallHistoryRepository
import com.chamadacerta.app.data.ContactWriter
import com.chamadacerta.app.data.ContactsHelper
import com.chamadacerta.app.data.ContactsRepository
import com.chamadacerta.app.data.DeviceStatusReader
import com.chamadacerta.app.data.ProtectionPreferences
import com.chamadacerta.app.data.ProtectionStore
import java.util.concurrent.Executors
import org.json.JSONObject

class AndroidBridge(
    private val activity: Activity,
    private val permissions: PermissionCoordinator,
    private val status: DeviceStatusReader,
    private val preferences: ProtectionPreferences,
    private val getDialRequest: () -> JSONObject,
) : AutoCloseable {
    private val worker = Executors.newSingleThreadExecutor()
    private val actions = DeviceActions(activity)
    private val contacts = ContactsRepository(activity)
    private val history = CallHistoryRepository(activity)

    fun invalidateContacts() = contacts.invalidate()

    // MainActivity checks WEB_MESSAGE_LISTENER before creating this bridge.
    @android.annotation.SuppressLint("RequiresFeature")
    fun attach(webView: WebView) {
        WebViewCompat.addWebMessageListener(
            webView,
            BridgeContract.OBJECT_NAME,
            setOf(BridgeContract.ORIGIN),
        ) { _, message, origin, mainFrame, proxy ->
            if (!mainFrame || origin.toString() != BridgeContract.ORIGIN)
                return@addWebMessageListener
            val request =
                runCatching { JSONObject(message.data.orEmpty()) }.getOrNull()
                    ?: return@addWebMessageListener
            val requestId = request.optString("id")
            if (requestId.length !in 1..100) return@addWebMessageListener
            val reply = BridgeReply(activity, proxy, requestId)
            val args = request.optJSONObject("args") ?: JSONObject()
            dispatch(request.optString("method"), args, reply)
        }
    }

    private fun dispatch(method: String, args: JSONObject, reply: BridgeReply) {
        if (dispatchPermission(method, reply)) return
        when (method) {
            "dialRequest" -> reply.success(getDialRequest())
            "openFullScreenSettings" -> actions.openFullScreenSettings(reply)
            "openInCall" -> actions.openInCall(reply)
            "openSettings" -> actions.openSettings(reply)
            "dial" -> actions.dial(args.optString("number"), reply)
            else -> worker.execute { executeQuery(method, args, reply) }
        }
    }

    private fun dispatchPermission(method: String, reply: BridgeReply): Boolean {
        when (method) {
            "requestDefaultDialer" -> permissions.requestDefaultDialer(reply)
            "requestCallPermission" ->
                permissions.requestPermission(Manifest.permission.CALL_PHONE, reply)
            "requestWriteContacts" ->
                permissions.requestPermission(Manifest.permission.WRITE_CONTACTS, reply)
            "requestNotifications" -> {
                if (Build.VERSION.SDK_INT >= 33)
                    permissions.requestPermission(Manifest.permission.POST_NOTIFICATIONS, reply)
                else reply.success(status.read())
            }
            "requestContacts" ->
                permissions.requestPermission(Manifest.permission.READ_CONTACTS, reply)
            "requestHistory" ->
                permissions.requestPermission(Manifest.permission.READ_CALL_LOG, reply)
            "requestScreening" -> permissions.requestScreening(reply)
            else -> return false
        }
        return true
    }

    private fun executeQuery(method: String, args: JSONObject, reply: BridgeReply) {
        try {
            val result =
                when (method) {
                    "saveContact" -> {
                        val saved =
                            ContactWriter(activity)
                                .save(args.getString("name"), args.getString("number"))
                        contacts.invalidate()
                        saved
                    }
                    "editContact" -> {
                        editContact(args.getString("id"), reply)
                        return
                    }
                    "status" -> status.read()
                    "contacts" -> JSONObject().put("items", contacts.read())
                    "history" -> history.read()
                    "setBlocking" -> {
                        preferences.setBlocking(
                            args.getBoolean("enabled"),
                            ContactsHelper.isAvailable(activity),
                        )
                        status.read()
                    }
                    "clearBlockedHistory" -> {
                        ProtectionStore(activity).use { it.clear() }
                        JSONObject().put("cleared", true)
                    }
                    else -> error("Ação indisponível.")
                }
            reply.success(result)
        } catch (_: SecurityException) {
            reply.failure(
                "A permissão foi negada ou revogada. Autorize o acesso nas configurações."
            )
        } catch (error: Exception) {
            reply.failure(error.message ?: "Não foi possível concluir a ação.")
        }
    }

    override fun close() {
        worker.shutdown()
    }

    private fun editContact(reference: String, reply: BridgeReply) {
        val uri = contacts.editTarget(reference)
        activity.runOnUiThread {
            if (!activity.isFinishing && !activity.isDestroyed) actions.editContact(uri, reply)
        }
    }
}
