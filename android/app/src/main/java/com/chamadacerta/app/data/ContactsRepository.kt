package com.chamadacerta.app.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.provider.ContactsContract.CommonDataKinds.Phone
import org.json.JSONArray
import org.json.JSONObject

class ContactsRepository(private val context: Context) {
    private fun granted(permission: String) =
        context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    fun read(): JSONArray {
        check(granted(Manifest.permission.READ_CONTACTS)) { "Acesso aos contatos não autorizado." }
        val result = JSONArray()
        context.contentResolver
            .query(
                Phone.CONTENT_URI,
                arrayOf(Phone._ID, Phone.DISPLAY_NAME, Phone.NUMBER),
                null,
                null,
                Phone.DISPLAY_NAME + " COLLATE LOCALIZED ASC",
            )
            ?.use { cursor ->
                while (cursor.moveToNext()) {
                    val number = cursor.getString(2) ?: continue
                    result.put(
                        JSONObject().apply {
                            put("id", "device_" + cursor.getLong(0))
                            put("name", cursor.getString(1) ?: number)
                            put("number", number)
                            put("rawNumber", number)
                        }
                    )
                }
            } ?: error("A agenda não respondeu. Tente novamente.")
        return result
    }
}
