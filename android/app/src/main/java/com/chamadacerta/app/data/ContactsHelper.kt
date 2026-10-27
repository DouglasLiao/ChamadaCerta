package com.chamadacerta.app.data

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.CancellationSignal
import android.provider.ContactsContract

object ContactsHelper {
    enum class Match {
        CONTACT,
        UNKNOWN,
        UNAVAILABLE,
    }

    fun isAvailable(context: Context): Boolean {
        if (
            context.checkSelfPermission(Manifest.permission.READ_CONTACTS) !=
                PackageManager.PERMISSION_GRANTED
        )
            return false
        return try {
            context.contentResolver
                .query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    arrayOf(ContactsContract.CommonDataKinds.Phone._ID),
                    null,
                    null,
                    null,
                )
                ?.use { true } ?: false
        } catch (_: Exception) {
            false
        }
    }

    fun lookup(context: Context, number: String?, cancellation: CancellationSignal? = null): Match {
        if (
            context.checkSelfPermission(Manifest.permission.READ_CONTACTS) !=
                PackageManager.PERMISSION_GRANTED
        )
            return Match.UNAVAILABLE
        if (number.isNullOrBlank()) return Match.UNKNOWN
        val uri =
            Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(number),
            )
        return try {
            context.contentResolver
                .query(
                    uri,
                    arrayOf(ContactsContract.PhoneLookup._ID),
                    null,
                    null,
                    null,
                    cancellation,
                )
                ?.use { if (it.moveToFirst()) Match.CONTACT else Match.UNKNOWN }
                ?: Match.UNAVAILABLE
        } catch (_: Exception) {
            Match.UNAVAILABLE
        }
    }
}
