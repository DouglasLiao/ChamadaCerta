package com.chamadacerta.app.calls

import android.app.Activity
import android.app.AlertDialog
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.telecom.Call
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.telecom.VideoProfile
import android.text.format.DateUtils
import android.view.Gravity
import android.view.MotionEvent
import android.view.WindowInsets
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.chamadacerta.app.MainActivity

class CallUiActivity : Activity() {
    private val main = Handler(Looper.getMainLooper())
    private var selectedId: String? = null
    private var keypad = false
    private var duration: TextView? = null
    private var toneCall: Call? = null
    private val stopToneTask = Runnable { stopTone() }
    private var registered = false
    private val updates =
        object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                render()
            }
        }
    private val ticker =
        object : Runnable {
            override fun run() {
                val call = selectedId?.let { PhoneCallService.instance()?.find(it) }
                val connected = call?.details?.connectTimeMillis ?: 0L
                duration?.text =
                    if (connected > 0)
                        DateUtils.formatElapsedTime(
                            ((System.currentTimeMillis() - connected) / 1000).coerceAtLeast(0)
                        )
                    else ""
                main.postDelayed(this, 1000)
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        selectedId =
            savedInstanceState?.getString("selected_call") ?: intent.getStringExtra("call_id")
        keypad =
            savedInstanceState?.getBoolean("keypad") ?: intent.getBooleanExtra("show_keypad", false)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        selectedId = intent.getStringExtra("call_id") ?: selectedId
        keypad = intent.getBooleanExtra("show_keypad", keypad)
        render()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        outState.putString("selected_call", selectedId)
        outState.putBoolean("keypad", keypad)
        super.onSaveInstanceState(outState)
    }

    override fun onResume() {
        super.onResume()
        val filter = IntentFilter(PhoneCallService.STATE_CHANGED)
        ContextCompat.registerReceiver(this, updates, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
        registered = true
        render()
        main.post(ticker)
    }

    override fun onPause() {
        stopTone()
        main.removeCallbacks(ticker)
        if (registered) unregisterReceiver(updates)
        registered = false
        super.onPause()
    }

    private fun render() {
        stopTone()
        val service = PhoneCallService.instance()
        val entries =
            service?.snapshot().orEmpty().filter { it.call.state != Call.STATE_DISCONNECTED }
        if (service == null || entries.isEmpty()) {
            finish()
            return
        }
        val entry =
            entries.firstOrNull { it.id == selectedId }
                ?: entries.firstOrNull { PhoneCallService.isRinging(it.call) }
                ?: entries.first()
        selectedId = entry.id
        val call = entry.call
        val root = createRoot()
        showIdentity(root, call)
        if (entries.size > 1) {
            label(root, "${entries.size} chamadas", 16, MUTED)
            entries
                .filter { it.id != selectedId }
                .forEach { other ->
                    button(
                        root,
                        "${CallNotifications.callerName(other.call)} · ${stateLabel(other.call)}",
                    ) {
                        selectedId = other.id
                        render()
                    }
                }
        }
        if (PhoneCallService.isRinging(call)) {
            button(root, "Atender", ACCENT) { service.perform(entry.id, PhoneCallService.ANSWER) }
            button(root, "Recusar", DECLINE) { service.perform(entry.id, PhoneCallService.REJECT) }
        } else if (call.state == Call.STATE_SELECT_PHONE_ACCOUNT) {
            showAccounts(root, call)
            button(root, "Cancelar chamada", DECLINE) {
                service.perform(entry.id, PhoneCallService.END)
            }
        } else {
            showActiveControls(root, service, entry)
        }
    }

    private fun createRoot(): LinearLayout {
        val root =
            LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundColor(Color.rgb(16, 19, 22))
                setPadding(dp(24), dp(52), dp(24), dp(28))
            }
        val scroll =
            ScrollView(this).apply {
                isFillViewport = true
                addView(root)
            }
        setContentView(scroll)
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false)
            scroll.setOnApplyWindowInsetsListener { view, insets ->
                val bars =
                    insets.getInsets(
                        WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout()
                    )
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
                insets
            }
            scroll.requestApplyInsets()
        }
        return root
    }

    private fun showIdentity(root: LinearLayout, call: Call) {
        label(root, "ChamadaCerta", 16, ACCENT)
        label(root, stateLabel(call), 18, MUTED)
        label(root, CallNotifications.callerName(call), 30, TEXT)
        call.details.handle?.schemeSpecificPart?.let { label(root, it, 18, MUTED) }
        label(root, "Número não verificado · identificação de golpes indisponível", 14, MUTED)
        if (VideoProfile.isVideo(call.details.videoState))
            label(root, "Chamada de vídeo · atendimento em áudio", 14, MUTED)
        duration = label(root, "", 20, TEXT)
    }

    private fun showActiveControls(
        root: LinearLayout,
        service: PhoneCallService,
        entry: PhoneCallService.Entry,
    ) {
        val call = entry.call
        button(root, if (service.muted) "Ativar microfone" else "Silenciar microfone") {
            service.setMicrophoneMuted(!service.muted)
        }
        button(root, "Saída de áudio") {
            val choices = service.audioChoices()
            if (choices.isEmpty())
                Toast.makeText(
                        this,
                        "Aguarde a disponibilidade do áudio da chamada.",
                        Toast.LENGTH_SHORT,
                    )
                    .show()
            else
                AlertDialog.Builder(this)
                    .setTitle("Saída de áudio")
                    .setSingleChoiceItems(
                        choices.map { it.label }.toTypedArray(),
                        choices.indexOfFirst { it.selected },
                    ) { dialog, index ->
                        service.routeAudio(choices[index].id)
                        dialog.dismiss()
                    }
                    .show()
        }
        if (call.state == Call.STATE_HOLDING || call.details.can(Call.Details.CAPABILITY_HOLD))
            button(
                root,
                if (call.state == Call.STATE_HOLDING) "Retomar chamada" else "Colocar em espera",
            ) {
                service.perform(entry.id, PhoneCallService.HOLD)
            }
        button(root, if (keypad) "Ocultar teclado" else "Teclado da chamada") {
            stopTone()
            keypad = !keypad
            render()
        }
        if (keypad) addKeypad(root, call)
        if (call.conferenceableCalls.isNotEmpty())
            button(root, "Unir chamadas") {
                runCatching { call.conference(call.conferenceableCalls.first()) }
            }
        if (call.details.can(Call.Details.CAPABILITY_MERGE_CONFERENCE))
            button(root, "Unir conferência") { runCatching { call.mergeConference() } }
        button(root, "Adicionar chamada") {
            startActivity(Intent(this, MainActivity::class.java).setAction(Intent.ACTION_DIAL))
        }
        button(root, "Encerrar chamada", DECLINE) {
            service.perform(entry.id, PhoneCallService.END)
        }
    }

    @Suppress("DEPRECATION")
    private fun showAccounts(root: LinearLayout, call: Call) {
        val handles =
            call.details.intentExtras?.getParcelableArrayList<PhoneAccountHandle>(
                Call.AVAILABLE_PHONE_ACCOUNTS
            )
                ?: call.details.extras
                    ?.getParcelableArrayList<PhoneAccountHandle>(Call.AVAILABLE_PHONE_ACCOUNTS)
                    .orEmpty()
        val telecom = getSystemService(TelecomManager::class.java)
        if (handles.isEmpty())
            label(
                root,
                "Não foi encontrada uma conta de chamadas. Confira o chip e a configuração de telefonia.",
                16,
                MUTED,
            )
        handles.forEach { handle ->
            val name =
                runCatching { telecom.getPhoneAccount(handle)?.label?.toString() }.getOrNull()
                    ?: "Conta de chamadas"
            button(root, name) { runCatching { call.phoneAccountSelected(handle, false) } }
        }
    }

    @android.annotation.SuppressLint("ClickableViewAccessibility")
    private fun addKeypad(root: LinearLayout, call: Call) {
        listOf("123", "456", "789", "*0#").forEach { rowKeys ->
            val row = LinearLayout(this)
            rowKeys.forEach { key ->
                val keyButton =
                    Button(this).apply {
                        text = key.toString()
                        contentDescription = "Enviar tom $key"
                        minHeight = dp(64)
                        setTextColor(TEXT)
                    }
                var handledByTouch = false
                keyButton.setOnTouchListener { view, event ->
                    when (event.actionMasked) {
                        MotionEvent.ACTION_DOWN -> {
                            handledByTouch = true
                            stopTone()
                            toneCall = call
                            runCatching { call.playDtmfTone(key) }
                            true
                        }
                        MotionEvent.ACTION_UP -> {
                            stopTone()
                            view.performClick()
                            true
                        }
                        MotionEvent.ACTION_CANCEL -> {
                            stopTone()
                            handledByTouch = false
                            true
                        }
                        else -> false
                    }
                }
                keyButton.setOnClickListener {
                    if (handledByTouch) handledByTouch = false
                    else {
                        stopTone()
                        toneCall = call
                        runCatching { call.playDtmfTone(key) }
                        main.postDelayed(stopToneTask, 150)
                    }
                }
                row.addView(keyButton, LinearLayout.LayoutParams(0, dp(68), 1f))
            }
            root.addView(row)
        }
    }

    private fun stopTone() {
        main.removeCallbacks(stopToneTask)
        runCatching { toneCall?.stopDtmfTone() }
        toneCall = null
    }

    private fun label(parent: LinearLayout, value: String, size: Int, color: Int): TextView =
        TextView(this).apply {
            text = value
            textSize = size.toFloat()
            setTextColor(color)
            gravity = Gravity.CENTER
            setPadding(0, dp(8), 0, dp(8))
            if (size >= 28) setTypeface(typeface, Typeface.BOLD)
            parent.addView(this, LinearLayout.LayoutParams(-1, -2))
        }

    private fun button(
        parent: LinearLayout,
        value: String,
        color: Int = SURFACE,
        action: () -> Unit,
    ) {
        val button =
            Button(this).apply {
                text = value
                isAllCaps = false
                minHeight = dp(56)
                setTextColor(if (color == ACCENT) Color.rgb(16, 19, 22) else TEXT)
                background =
                    GradientDrawable().apply {
                        setColor(color)
                        cornerRadius = dp(20).toFloat()
                    }
                setOnClickListener { action() }
            }
        parent.addView(button, LinearLayout.LayoutParams(-1, -2).apply { topMargin = dp(12) })
    }

    private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

    private fun stateLabel(call: Call): String =
        when {
            PhoneCallService.isRinging(call) -> "Chamada recebida"
            call.state == Call.STATE_ACTIVE -> "Em chamada"
            call.state == Call.STATE_HOLDING -> "Em espera"
            call.state == Call.STATE_SELECT_PHONE_ACCOUNT -> "Escolha o chip ou conta"
            call.state == Call.STATE_DIALING || call.state == Call.STATE_CONNECTING -> "Ligando…"
            call.state == Call.STATE_DISCONNECTING || call.state == Call.STATE_DISCONNECTED ->
                "Finalizando chamada"
            else -> "Preparando chamada…"
        }

    companion object {
        private val ACCENT = Color.rgb(128, 229, 179)
        private val TEXT = Color.rgb(244, 246, 245)
        private val MUTED = Color.rgb(169, 182, 176)
        private val SURFACE = Color.rgb(27, 34, 32)
        private val DECLINE = Color.rgb(145, 43, 52)
    }
}
