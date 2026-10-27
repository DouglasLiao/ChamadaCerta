package com.chamadacerta.app.service

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.CancellationSignal
import android.os.Handler
import android.os.Looper
import android.telecom.Call
import android.telecom.CallScreeningService
import com.chamadacerta.app.bridge.BridgeContract
import com.chamadacerta.app.data.ContactsHelper
import com.chamadacerta.app.data.ProtectionPreferences
import com.chamadacerta.app.data.ProtectionStore
import com.chamadacerta.app.domain.ProtectionPolicy
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class ChamadaCertaScreeningService : CallScreeningService() {
    private val worker = Executors.newFixedThreadPool(2)
    private val main = Handler(Looper.getMainLooper())
    private val pendingQueries = ConcurrentHashMap.newKeySet<CancellationSignal>()
    private var destroyed = false

    override fun onScreenCall(details: Call.Details) {
        if (details.callDirection != Call.Details.DIRECTION_INCOMING) return
        val answered = AtomicBoolean(false)
        val cancellation = CancellationSignal()
        pendingQueries.add(cancellation)
        val number = details.handle?.schemeSpecificPart.orEmpty()
        val preferences = ProtectionPreferences(applicationContext)
        fun respond(blocked: Boolean) {
            if (!answered.compareAndSet(false, true)) return
            respondToCall(
                details,
                CallResponse.Builder()
                    .setDisallowCall(blocked)
                    .setRejectCall(blocked)
                    .setSkipCallLog(false)
                    .setSkipNotification(blocked)
                    .build(),
            )
        }
        val timeout = Runnable {
            preferences.reportScreeningError(
                "A consulta aos contatos excedeu o prazo. A chamada foi permitida."
            )
            respond(false)
            sendBroadcast(
                Intent(BridgeContract.callsChangedAction(packageName)).setPackage(packageName)
            )
            cancellation.cancel()
        }
        main.postDelayed(timeout, SCREENING_TIMEOUT_MS)
        worker.execute {
            val match = ContactsHelper.lookup(applicationContext, number, cancellation)
            pendingQueries.remove(cancellation)
            main.post {
                if (destroyed) return@post
                if (!answered.get()) {
                    main.removeCallbacks(timeout)
                    // Recheck permission and preference after asynchronous lookup.
                    val available =
                        match != ContactsHelper.Match.UNAVAILABLE &&
                            checkSelfPermission(Manifest.permission.READ_CONTACTS) ==
                                PackageManager.PERMISSION_GRANTED
                    val blocked =
                        ProtectionPolicy.shouldBlock(
                            preferences.blockingEnabled,
                            available,
                            match == ContactsHelper.Match.CONTACT,
                        )
                    preferences.reportScreeningError(
                        if (available) ""
                        else "Não foi possível consultar seus contatos. A chamada foi permitida."
                    )
                    respond(blocked)
                    worker.execute {
                        runCatching {
                            ProtectionStore(applicationContext).use { store ->
                                store.record(
                                    number,
                                    blocked,
                                    match == ContactsHelper.Match.CONTACT,
                                    if (blocked) "Número fora dos contatos" else null,
                                )
                            }
                        }
                        sendBroadcast(
                            Intent(BridgeContract.callsChangedAction(packageName))
                                .setPackage(packageName)
                        )
                    }
                }
            }
        }
    }

    companion object {
        private const val SCREENING_TIMEOUT_MS = 3500L
    }

    override fun onDestroy() {
        destroyed = true
        main.removeCallbacksAndMessages(null)
        pendingQueries.forEach { it.cancel() }
        pendingQueries.clear()
        worker.shutdown()
        super.onDestroy()
    }
}
