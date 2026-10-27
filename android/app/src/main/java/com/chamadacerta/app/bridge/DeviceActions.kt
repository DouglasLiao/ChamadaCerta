package com.chamadacerta.app.bridge

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.telecom.TelecomManager
import com.chamadacerta.app.calls.CallUiActivity
import com.chamadacerta.app.calls.PhoneCallService
import com.chamadacerta.app.domain.DialNumber
import org.json.JSONObject

class DeviceActions(private val activity: Activity) {
    fun openSettings(reply: BridgeReply) =
        open(
            Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:${activity.packageName}"),
            ),
            reply,
            "Não foi possível abrir as configurações do aplicativo.",
        )

    fun dial(input: String, reply: BridgeReply) {
        val number = DialNumber.parse(input)
        if (number == null) {
            reply.failure("Confira o número digitado.")
            return
        }
        if (
            activity.checkSelfPermission(Manifest.permission.CALL_PHONE) !=
                PackageManager.PERMISSION_GRANTED
        ) {
            reply.failure("Autorize chamadas telefônicas para ligar pelo ChamadaCerta.")
            return
        }
        try {
            val telecom = activity.getSystemService(TelecomManager::class.java)
            checkNotNull(telecom) { "Telefonia indisponível neste aparelho." }
            telecom.placeCall(Uri.fromParts("tel", number, null), Bundle())
            reply.success(JSONObject().put("started", true))
        } catch (_: Exception) {
            reply.failure(
                "Não foi possível iniciar a chamada. Confira as permissões, o chip e a rede do aparelho."
            )
        }
    }

    fun openInCall(reply: BridgeReply) {
        if (!PhoneCallService.hasActiveCalls()) {
            reply.failure("Não há chamada em andamento.")
            return
        }
        open(
            Intent(activity, CallUiActivity::class.java),
            reply,
            "Não foi possível abrir a chamada.",
        )
    }

    fun openFullScreenSettings(reply: BridgeReply) {
        if (Build.VERSION.SDK_INT >= 34) {
            open(
                Intent(
                    Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    Uri.parse("package:${activity.packageName}"),
                ),
                reply,
                "Não foi possível abrir a configuração de chamadas recebidas.",
            )
        } else reply.success(JSONObject().put("opened", false))
    }

    private fun open(intent: Intent, reply: BridgeReply, errorMessage: String) {
        try {
            activity.startActivity(intent)
            reply.success(JSONObject().put("opened", true))
        } catch (_: Exception) {
            reply.failure(errorMessage)
        }
    }
}
