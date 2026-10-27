package com.chamadacerta.app.calls

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class CallActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getStringExtra("call_id") ?: return
        val action = intent.action ?: return
        PhoneCallService.instance()?.perform(id, action)
    }
}
