package com.chamadacerta.app.calls

import android.Manifest
import android.app.ActivityOptions
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Person
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.telecom.Call
import com.chamadacerta.app.R

class CallNotifications(private val context: Context) {
    private val manager = context.getSystemService(NotificationManager::class.java)

    init {
        manager.createNotificationChannel(
            NotificationChannel(
                    CHANNEL,
                    "Chamadas telefônicas",
                    NotificationManager.IMPORTANCE_HIGH,
                )
                .apply {
                    description = "Chamadas recebidas e em andamento"
                    setSound(null, null)
                    enableVibration(false)
                }
        )
    }

    fun update(id: String, call: Call) {
        if (
            Build.VERSION.SDK_INT >= 33 &&
                context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) !=
                    PackageManager.PERMISSION_GRANTED
        )
            return
        if (!canNotify(context)) return
        val title = callerName(call)
        val ringing = PhoneCallService.isRinging(call)
        val view = activityIntent(id)
        val answer = actionIntent(id, PhoneCallService.ANSWER)
        val reject = actionIntent(id, PhoneCallService.REJECT)
        val end = actionIntent(id, PhoneCallService.END)
        val notification =
            Notification.Builder(context, CHANNEL)
                .setSmallIcon(R.drawable.ic_call)
                .setContentTitle(title)
                .setContentText(if (ringing) "Chamada recebida" else "Chamada em andamento")
                .setContentIntent(view)
                .setCategory(Notification.CATEGORY_CALL)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setVisibility(Notification.VISIBILITY_PRIVATE)
        if (ringing && (Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent()))
            notification.setFullScreenIntent(view, true)
        if (Build.VERSION.SDK_INT >= 31) {
            val person = Person.Builder().setName(title).setImportant(true).build()
            notification.setStyle(
                if (ringing) Notification.CallStyle.forIncomingCall(person, reject, answer)
                else Notification.CallStyle.forOngoingCall(person, end)
            )
        } else {
            if (ringing) {
                notification.addAction(Notification.Action.Builder(null, "Recusar", reject).build())
                notification.addAction(Notification.Action.Builder(null, "Atender", answer).build())
            } else
                notification.addAction(Notification.Action.Builder(null, "Encerrar", end).build())
        }
        runCatching { manager.notify(id, NOTIFICATION_ID, notification.build()) }
    }

    fun remove(id: String) {
        manager.cancel(id, NOTIFICATION_ID)
    }

    private fun activityIntent(id: String): PendingIntent {
        val intent =
            Intent(context, CallUiActivity::class.java)
                .setData(Uri.parse("chamadacerta://call/$id"))
                .putExtra("call_id", id)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        val options =
            if (Build.VERSION.SDK_INT >= 35)
                ActivityOptions.makeBasic()
                    .setPendingIntentCreatorBackgroundActivityStartMode(
                        ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
                    )
                    .toBundle()
            else null
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            options,
        )
    }

    private fun actionIntent(id: String, action: String): PendingIntent =
        PendingIntent.getBroadcast(
            context,
            0,
            Intent(context, CallActionReceiver::class.java)
                .setAction(action)
                .setData(Uri.parse("chamadacerta://call/$id/$action"))
                .putExtra("call_id", id),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    companion object {
        private const val CHANNEL = "phone_calls"
        private const val NOTIFICATION_ID = 100

        fun canNotify(context: Context): Boolean {
            val manager = context.getSystemService(NotificationManager::class.java)
            return manager.areNotificationsEnabled() &&
                manager.getNotificationChannel(CHANNEL)?.importance !=
                    NotificationManager.IMPORTANCE_NONE
        }

        fun callerName(call: Call): String {
            if (call.details.hasProperty(Call.Details.PROPERTY_CONFERENCE)) return "Conferência"
            val contact = if (Build.VERSION.SDK_INT >= 30) call.details.contactDisplayName else null
            return contact?.takeIf { it.isNotBlank() }
                ?: call.details.callerDisplayName?.takeIf { it.isNotBlank() }
                ?: call.details.handle?.schemeSpecificPart
                ?: "Número privado"
        }
    }
}
