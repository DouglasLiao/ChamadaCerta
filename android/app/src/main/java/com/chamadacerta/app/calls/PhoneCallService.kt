package com.chamadacerta.app.calls

import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.OutcomeReceiver
import android.telecom.Call
import android.telecom.CallAudioState
import android.telecom.CallEndpoint
import android.telecom.CallEndpointException
import android.telecom.InCallService
import android.telecom.VideoProfile
import android.widget.Toast
import java.lang.ref.WeakReference
import java.util.UUID

class PhoneCallService : InCallService() {
    data class Entry(val id: String, val call: Call)

    data class AudioChoice(val id: String, val label: String, val selected: Boolean)

    private val entries = linkedMapOf<String, Call>()
    private val callbacks = mutableMapOf<Call, Call.Callback>()
    private val main = Handler(Looper.getMainLooper())
    private var modernRoutes: List<AudioChoice> = emptyList()
    private var requestModernRoute: ((String) -> Unit)? = null
    var muted = false
        private set

    private lateinit var notifications: CallNotifications

    override fun onCreate() {
        super.onCreate()
        current = WeakReference(this)
        notifications = CallNotifications(this)
    }

    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        val id = UUID.randomUUID().toString()
        entries[id] = call
        val callback =
            object : Call.Callback() {
                override fun onStateChanged(call: Call, state: Int) = changed(id)

                override fun onDetailsChanged(call: Call, details: Call.Details) = changed(id)

                override fun onParentChanged(call: Call, parent: Call?) = changed(id)

                override fun onChildrenChanged(call: Call, children: MutableList<Call>) =
                    changed(id)

                override fun onConferenceableCallsChanged(
                    call: Call,
                    conferenceableCalls: MutableList<Call>,
                ) = changed(id)
            }
        callbacks[call] = callback
        call.registerCallback(callback, main)
        changed(id)
        if (
            call.details.callDirection == Call.Details.DIRECTION_OUTGOING ||
                !CallNotifications.canNotify(this)
        )
            showCall(id)
    }

    override fun onCallRemoved(call: Call) {
        callbacks.remove(call)?.let { call.unregisterCallback(it) }
        val id = entries.entries.firstOrNull { it.value === call }?.key
        if (id != null) {
            entries.remove(id)
            notifications.remove(id)
        }
        publish()
        super.onCallRemoved(call)
    }

    fun snapshot(): List<Entry> =
        entries.filterValues { it.parent == null }.map { Entry(it.key, it.value) }

    fun find(id: String): Call? = entries[id]

    private fun changed(id: String) {
        entries[id]?.let { call ->
            if (call.state == Call.STATE_DISCONNECTED || call.parent != null)
                notifications.remove(id)
            else notifications.update(id, call)
        }
        publish()
    }

    private fun publish() {
        activeCount = entries.values.count { it.state != Call.STATE_DISCONNECTED }
        sendBroadcast(Intent(STATE_CHANGED).setPackage(packageName))
    }

    fun perform(id: String, action: String) {
        val call = entries[id] ?: return
        runCatching {
                when (action) {
                    ANSWER -> if (isRinging(call)) call.answer(VideoProfile.STATE_AUDIO_ONLY)
                    REJECT -> if (isRinging(call)) call.reject(false, null)
                    END -> if (call.state != Call.STATE_DISCONNECTED) call.disconnect()
                    HOLD ->
                        if (call.state == Call.STATE_HOLDING) call.unhold()
                        else if (call.details.can(Call.Details.CAPABILITY_HOLD)) call.hold()
                }
            }
            .onFailure { reportError("Não foi possível executar a ação da chamada.") }
    }

    fun setMicrophoneMuted(value: Boolean) {
        setMuted(value)
    }

    @Suppress("DEPRECATION")
    override fun onCallAudioStateChanged(audioState: CallAudioState) {
        super.onCallAudioStateChanged(audioState)
        muted = audioState.isMuted
        publish()
    }

    override fun onMuteStateChanged(isMuted: Boolean) {
        muted = isMuted
        publish()
    }

    @androidx.annotation.RequiresApi(34)
    override fun onAvailableCallEndpointsChanged(availableEndpoints: MutableList<CallEndpoint>) {
        modernRoutes =
            availableEndpoints.map { endpoint ->
                AudioChoice(
                    endpoint.identifier.toString(),
                    endpoint.endpointName.toString(),
                    endpoint == currentCallEndpoint,
                )
            }
        requestModernRoute = { id ->
            val endpoint = availableEndpoints.firstOrNull { it.identifier.toString() == id }
            if (endpoint != null)
                requestCallEndpointChange(
                    endpoint,
                    mainExecutor,
                    object : OutcomeReceiver<Void, CallEndpointException> {
                        override fun onResult(result: Void?) {
                            publish()
                        }

                        override fun onError(error: CallEndpointException) {
                            reportError("Não foi possível alterar a saída de áudio.")
                        }
                    },
                )
        }
        publish()
    }

    @androidx.annotation.RequiresApi(34)
    override fun onCallEndpointChanged(callEndpoint: CallEndpoint) {
        modernRoutes =
            modernRoutes.map { it.copy(selected = it.id == callEndpoint.identifier.toString()) }
        publish()
    }

    @Suppress("DEPRECATION")
    fun audioChoices(): List<AudioChoice> {
        if (Build.VERSION.SDK_INT >= 34) return modernRoutes
        val audio = callAudioState ?: return emptyList()
        return listOf(
                CallAudioState.ROUTE_EARPIECE to "Telefone",
                CallAudioState.ROUTE_SPEAKER to "Viva-voz",
                CallAudioState.ROUTE_BLUETOOTH to "Bluetooth",
                CallAudioState.ROUTE_WIRED_HEADSET to "Fone com fio",
            )
            .filter { (route, _) -> audio.supportedRouteMask and route != 0 }
            .map { (route, label) -> AudioChoice(route.toString(), label, audio.route == route) }
    }

    @Suppress("DEPRECATION")
    fun routeAudio(id: String) {
        runCatching {
                if (Build.VERSION.SDK_INT >= 34) requestModernRoute?.invoke(id)
                else id.toIntOrNull()?.let { setAudioRoute(it) }
            }
            .onFailure { reportError("Não foi possível alterar a saída de áudio.") }
    }

    fun showCall(id: String? = null, keypad: Boolean = false) {
        runCatching {
            startActivity(
                Intent(this, CallUiActivity::class.java)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                    .putExtra("call_id", id)
                    .putExtra("show_keypad", keypad)
            )
        }
    }

    override fun onBringToForeground(showDialpad: Boolean) {
        showCall(keypad = showDialpad)
    }

    override fun onSilenceRinger() {
        super.onSilenceRinger()
    }

    private fun reportError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }

    override fun onDestroy() {
        callbacks.forEach { (call, callback) -> call.unregisterCallback(callback) }
        entries.keys.forEach { notifications.remove(it) }
        callbacks.clear()
        entries.clear()
        activeCount = 0
        if (current?.get() === this) current = null
        sendBroadcast(Intent(STATE_CHANGED).setPackage(packageName))
        super.onDestroy()
    }

    companion object {
        const val STATE_CHANGED = "com.chamadacerta.app.CALL_STATE_CHANGED"
        const val ANSWER = "answer"
        const val REJECT = "reject"
        const val END = "end"
        const val HOLD = "hold"
        private var current: WeakReference<PhoneCallService>? = null
        @Volatile private var activeCount = 0

        fun instance(): PhoneCallService? = current?.get()

        fun hasActiveCalls(): Boolean = activeCount > 0

        fun isRinging(call: Call): Boolean =
            call.state == Call.STATE_RINGING ||
                (Build.VERSION.SDK_INT >= 30 && call.state == Call.STATE_SIMULATED_RINGING)
    }
}
