package com.chamadacerta.app.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.ContactsContract.CommonDataKinds.Phone
import android.provider.ContactsContract.Contacts
import com.chamadacerta.app.domain.ContactReference
import java.util.concurrent.atomic.AtomicLong
import org.json.JSONArray
import org.json.JSONObject

class ContactsRepository(private val context: Context) {
    private val revision = AtomicLong()
    @Volatile private var cached: Pair<Long, JSONArray>? = null

    fun invalidate() {
        revision.incrementAndGet()
        cached = null
    }

    private fun granted(permission: String) =
        context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

    fun read(): JSONArray {
        check(granted(Manifest.permission.READ_CONTACTS)) { "Acesso aos contatos não autorizado." }
        val currentRevision = revision.get()
        cached
            ?.takeIf { it.first == currentRevision }
            ?.let {
                return it.second
            }
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
                        }
                    )
                }
            } ?: error("A agenda não respondeu. Tente novamente.")
        check(granted(Manifest.permission.READ_CONTACTS)) { "Acesso aos contatos revogado." }
        if (revision.get() == currentRevision) cached = currentRevision to result
        return result
    }

    fun editTarget(reference: String): Uri {
        if (!granted(Manifest.permission.READ_CONTACTS))
            throw SecurityException("Autorize a leitura dos contatos para editar.")
        val dataId = ContactReference.dataId(reference)
        return context.contentResolver
            .query(
                Phone.CONTENT_URI,
                arrayOf(Phone.CONTACT_ID, Phone.LOOKUP_KEY),
                Phone._ID + " = ?",
                arrayOf(dataId.toString()),
                null,
            )
            ?.use { cursor ->
                check(cursor.moveToFirst()) {
                    "O contato não está mais disponível. Atualize a agenda."
                }
                check(granted(Manifest.permission.READ_CONTACTS)) {
                    "Acesso aos contatos revogado."
                }
                requireNotNull(Contacts.getLookupUri(cursor.getLong(0), cursor.getString(1))) {
                    "Não foi possível localizar o contato para edição."
                }
            } ?: error("A agenda não respondeu. Tente novamente.")
    }
}
