package com.chamadacerta.app.bridge

import android.app.Activity
import androidx.webkit.JavaScriptReplyProxy
import org.json.JSONObject

class BridgeReply(
    private val activity: Activity,
    private val proxy: JavaScriptReplyProxy,
    private val requestId: String,
) {
    fun success(result: JSONObject) = send(JSONObject().put("id", requestId).put("result", result))

    fun failure(message: String) = send(JSONObject().put("id", requestId).put("error", message))

    // The bridge is only installed after WEB_MESSAGE_LISTENER has been checked.
    @android.annotation.SuppressLint("RequiresFeature")
    private fun send(message: JSONObject) {
        activity.runOnUiThread {
            if (!activity.isFinishing && !activity.isDestroyed) {
                runCatching { proxy.postMessage(message.toString()) }
            }
        }
    }
}
