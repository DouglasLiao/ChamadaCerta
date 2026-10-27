package com.chamadacerta.app.bridge

object BridgeContract {
    const val ORIGIN = "https://appassets.androidplatform.net"
    const val ENTRY_URL = "$ORIGIN/app"
    const val OBJECT_NAME = "ChamadaCertaNative"
    const val DIAL_REQUEST_EVENT = "chamadacerta:dial-request"
    const val REFRESH_EVENT = "chamadacerta:refresh"

    fun callsChangedAction(packageName: String) = "$packageName.CALLS_CHANGED"
}
