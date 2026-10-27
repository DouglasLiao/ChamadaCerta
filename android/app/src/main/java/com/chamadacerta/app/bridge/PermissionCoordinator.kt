package com.chamadacerta.app.bridge

import android.app.Activity
import android.app.role.RoleManager
import android.content.pm.PackageManager
import com.chamadacerta.app.data.DeviceStatusReader

class PermissionCoordinator(
    private val activity: Activity,
    private val status: DeviceStatusReader,
) {
    private var pendingReply: BridgeReply? = null
    private var pendingCode: Int? = null

    fun requestPermission(permission: String, reply: BridgeReply) {
        if (isBusy(reply)) return
        if (activity.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED) {
            reply.success(status.read())
            return
        }
        launch(PERMISSION_REQUEST, reply) {
            activity.requestPermissions(arrayOf(permission), PERMISSION_REQUEST)
        }
    }

    fun requestScreening(reply: BridgeReply) {
        if (isBusy(reply)) return
        val roles = activity.getSystemService(RoleManager::class.java)
        if (!roles.isRoleAvailable(RoleManager.ROLE_CALL_SCREENING)) {
            reply.failure("Este aparelho não oferece triagem de chamadas.")
            return
        }
        if (roles.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) {
            reply.success(status.read())
            return
        }
        launch(SCREENING_REQUEST, reply) {
            activity.startActivityForResult(
                roles.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING),
                SCREENING_REQUEST,
            )
        }
    }

    fun requestDefaultDialer(reply: BridgeReply) {
        if (isBusy(reply)) return
        val roles = activity.getSystemService(RoleManager::class.java)
        if (!roles.isRoleAvailable(RoleManager.ROLE_DIALER)) {
            reply.failure("Este aparelho não oferece a função de telefone padrão.")
            return
        }
        if (roles.isRoleHeld(RoleManager.ROLE_DIALER)) {
            reply.success(status.read())
            return
        }
        launch(DIALER_REQUEST, reply) {
            activity.startActivityForResult(
                roles.createRequestRoleIntent(RoleManager.ROLE_DIALER),
                DIALER_REQUEST,
            )
        }
    }

    fun complete(requestCode: Int) {
        if (requestCode != pendingCode) return
        val reply = pendingReply
        pendingReply = null
        pendingCode = null
        reply?.success(status.read())
    }

    private fun isBusy(reply: BridgeReply): Boolean {
        if (pendingReply == null) return false
        reply.failure("Conclua a solicitação de acesso atual.")
        return true
    }

    private fun launch(code: Int, reply: BridgeReply, operation: () -> Unit) {
        pendingReply = reply
        pendingCode = code
        try {
            operation()
        } catch (_: Exception) {
            pendingReply = null
            pendingCode = null
            reply.failure("Não foi possível abrir a solicitação do Android.")
        }
    }

    companion object {
        private const val PERMISSION_REQUEST = 10
        private const val SCREENING_REQUEST = 11
        private const val DIALER_REQUEST = 12
    }
}
