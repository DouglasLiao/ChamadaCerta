package com.chamadacerta.app.data

import android.content.Context

class ProtectionPreferences(context: Context) {
    private val preferences = context.getSharedPreferences(FILE_NAME, Context.MODE_PRIVATE)
    val blockingEnabled: Boolean
        get() = preferences.getBoolean(BLOCKING_KEY, false)

    val screeningError: String
        get() = preferences.getString(ERROR_KEY, "").orEmpty()

    fun setBlocking(enabled: Boolean, contactsAvailable: Boolean) {
        val update = preferences.edit().putBoolean(BLOCKING_KEY, enabled)
        if (contactsAvailable) update.putString(ERROR_KEY, "")
        check(update.commit()) { "Não foi possível salvar a preferência." }
    }

    fun reportScreeningError(message: String) {
        preferences.edit().putString(ERROR_KEY, message).apply()
    }

    companion object {
        private const val FILE_NAME = "chamadacerta_prefs"
        private const val BLOCKING_KEY = "block_non_contacts"
        private const val ERROR_KEY = "last_screening_error"
    }
}
