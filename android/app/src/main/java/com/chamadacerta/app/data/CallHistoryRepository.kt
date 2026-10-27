package com.chamadacerta.app.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.database.Cursor
import android.os.Build
import android.provider.CallLog
import android.telephony.PhoneNumberUtils
import org.json.JSONArray
import org.json.JSONObject

class CallHistoryRepository(private val context: Context) {
    private fun granted(permission: String) =
        context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    fun read(): JSONObject {
        val localEntries = ProtectionStore(context).use { it.entries() }
        if (!granted(Manifest.permission.READ_CALL_LOG)) return snapshot(localEntries)
        return try {
            // Merge into a copy: a failed or revoked system read must never expose partial data.
            val combined = readSystemHistory(JSONArray(localEntries.toString()))
            if (granted(Manifest.permission.READ_CALL_LOG)) snapshot(combined)
            else
                snapshot(
                    localEntries,
                    "O acesso ao histórico foi revogado. Mostrando apenas registros do aplicativo.",
                )
        } catch (_: SecurityException) {
            snapshot(
                localEntries,
                "O acesso ao histórico foi negado ou revogado. Mostrando apenas registros do aplicativo.",
            )
        } catch (_: Exception) {
            snapshot(
                localEntries,
                "Não foi possível ler o histórico do aparelho. Mostrando apenas registros do aplicativo.",
            )
        }
    }

    private fun snapshot(entries: JSONArray, warning: String = ""): JSONObject =
        JSONObject().put("items", entries).put("warning", warning)

    private fun readSystemHistory(result: JSONArray): JSONArray {
        context.contentResolver
            .query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(
                    CallLog.Calls._ID,
                    CallLog.Calls.NUMBER,
                    CallLog.Calls.CACHED_NAME,
                    CallLog.Calls.DATE,
                    CallLog.Calls.TYPE,
                    CallLog.Calls.DURATION,
                ),
                null,
                null,
                CallLog.Calls.DATE + " DESC",
            )
            ?.use { cursor ->
                var count = 0
                while (cursor.moveToNext() && count++ < MAX_HISTORY_ENTRIES) {
                    val number = cursor.getString(1).orEmpty()
                    val time = cursor.getLong(3)
                    if (!removeMatchingAttempts(result, number, time))
                        result.put(systemEntry(cursor))
                }
            } ?: error("O histórico do aparelho não respondeu.")
        return result
    }

    private fun removeMatchingAttempts(result: JSONArray, number: String, time: Long): Boolean {
        var blocked = false
        for (index in result.length() - 1 downTo 0) {
            val item = result.getJSONObject(index)
            if (
                isSameNumber(item.optString("number"), number) &&
                    kotlin.math.abs(item.optLong("timestamp") - time) < SAME_CALL_WINDOW_MS
            ) {
                if (item.optString("status") == "blocked") blocked = true else result.remove(index)
            }
        }
        return blocked
    }

    private fun systemEntry(cursor: Cursor): JSONObject {
        val number = cursor.getString(1).orEmpty()
        val time = cursor.getLong(3)
        val type = cursor.getInt(4)
        return JSONObject().apply {
            put("id", "system_" + cursor.getLong(0))
            put("number", number.ifEmpty { "Número privado" })
            put("name", cursor.getString(2) ?: JSONObject.NULL)
            put("timestamp", time)
            put(
                "status",
                when (type) {
                    CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                    CallLog.Calls.MISSED_TYPE -> "missed"
                    CallLog.Calls.BLOCKED_TYPE -> "blocked"
                    CallLog.Calls.REJECTED_TYPE -> "rejected"
                    else -> "incoming"
                },
            )
            put("isContact", ContactsHelper.lookup(context, number) == ContactsHelper.Match.CONTACT)
            put("duration", cursor.getLong(5).toString() + "s")
            put("source", "system")
        }
    }

    private fun isSameNumber(first: String, second: String): Boolean {
        val country = context.resources.configuration.locales[0].country.ifBlank { "BR" }
        if (Build.VERSION.SDK_INT >= 31)
            return PhoneNumberUtils.areSamePhoneNumber(first, second, country)
        val firstInternational = PhoneNumberUtils.formatNumberToE164(first, country)
        val secondInternational = PhoneNumberUtils.formatNumberToE164(second, country)
        if (firstInternational != null && secondInternational != null)
            return firstInternational == secondInternational
        val normalizedFirst = PhoneNumberUtils.normalizeNumber(first)
        return normalizedFirst.isNotEmpty() &&
            normalizedFirst == PhoneNumberUtils.normalizeNumber(second)
    }

    companion object {
        private const val MAX_HISTORY_ENTRIES = 200
        private const val SAME_CALL_WINDOW_MS = 10_000L
    }
}
