package com.chamadacerta.app.data

import android.Manifest
import android.app.NotificationManager
import android.app.role.RoleManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telecom.TelecomManager
import com.chamadacerta.app.calls.CallNotifications
import com.chamadacerta.app.calls.PhoneCallService
import org.json.JSONObject

class DeviceStatusReader(
    private val context: Context,
    private val preferences: ProtectionPreferences,
) {
    fun read(): JSONObject {
        val roles = context.getSystemService(RoleManager::class.java)
        val contactsGranted = granted(Manifest.permission.READ_CONTACTS)
        val screeningAvailable = roles.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)
        val screeningHeld = screeningAvailable && roles.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)
        val dialerAvailable = roles.isRoleAvailable(RoleManager.ROLE_DIALER)
        val notifications = context.getSystemService(NotificationManager::class.java)
        val enabled = preferences.blockingEnabled
        val error = preferences.screeningError
        return JSONObject().apply {
            put("contactsPermission", contactsGranted)
            put("writeContactsPermission", granted(Manifest.permission.WRITE_CONTACTS))
            put("callPermission", granted(Manifest.permission.CALL_PHONE))
            put("dialerAvailable", dialerAvailable)
            put("dialerHeld", dialerAvailable && roles.isRoleHeld(RoleManager.ROLE_DIALER))
            put("notificationsPermission", CallNotifications.canNotify(context))
            put(
                "fullScreenAllowed",
                Build.VERSION.SDK_INT < 34 || notifications.canUseFullScreenIntent(),
            )
            put("hasActiveCall", PhoneCallService.hasActiveCalls())
            put("callLogPermission", granted(Manifest.permission.READ_CALL_LOG))
            put("screeningAvailable", screeningAvailable)
            put("screeningHeld", screeningHeld)
            put("blockNonContacts", enabled)
            put("protectionActive", enabled && contactsGranted && screeningHeld && error.isEmpty())
            put("screeningError", error)
            put("canDial", context.getSystemService(TelecomManager::class.java) != null)
            put("verification", "unavailable")
        }
    }

    private fun granted(permission: String) =
        context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED
}
