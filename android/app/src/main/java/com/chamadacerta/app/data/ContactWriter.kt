package com.chamadacerta.app.data

import android.Manifest
import android.content.ContentProviderOperation
import android.content.Context
import android.content.pm.PackageManager
import android.provider.ContactsContract
import com.chamadacerta.app.domain.ContactDraft
import org.json.JSONObject

class ContactWriter(private val context: Context) {
    fun save(name: String, number: String): JSONObject {
        if (
            context.checkSelfPermission(Manifest.permission.WRITE_CONTACTS) !=
                PackageManager.PERMISSION_GRANTED
        ) {
            throw SecurityException("Acesso de escrita aos contatos não autorizado.")
        }
        val draft = ContactDraft.validate(name, number)
        val operations =
            arrayListOf(
                ContentProviderOperation.newInsert(ContactsContract.RawContacts.CONTENT_URI)
                    .withValue(ContactsContract.RawContacts.ACCOUNT_TYPE, null)
                    .withValue(ContactsContract.RawContacts.ACCOUNT_NAME, null)
                    .build(),
                ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                    .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
                    .withValue(
                        ContactsContract.Data.MIMETYPE,
                        ContactsContract.CommonDataKinds.StructuredName.CONTENT_ITEM_TYPE,
                    )
                    .withValue(
                        ContactsContract.CommonDataKinds.StructuredName.DISPLAY_NAME,
                        draft.name,
                    )
                    .build(),
                ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
                    .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
                    .withValue(
                        ContactsContract.Data.MIMETYPE,
                        ContactsContract.CommonDataKinds.Phone.CONTENT_ITEM_TYPE,
                    )
                    .withValue(ContactsContract.CommonDataKinds.Phone.NUMBER, draft.number)
                    .withValue(
                        ContactsContract.CommonDataKinds.Phone.TYPE,
                        ContactsContract.CommonDataKinds.Phone.TYPE_OTHER,
                    )
                    .build(),
            )
        val results = context.contentResolver.applyBatch(ContactsContract.AUTHORITY, operations)
        check(results.firstOrNull()?.uri != null) {
            "A agenda não confirmou o salvamento do contato."
        }
        return JSONObject().put("saved", true)
    }
}
