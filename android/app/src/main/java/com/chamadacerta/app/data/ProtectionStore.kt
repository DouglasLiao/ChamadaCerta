package com.chamadacerta.app.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

class ProtectionStore(context: Context) : SQLiteOpenHelper(context, "protection.db", null, 1) {
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(
            "CREATE TABLE calls (id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL, " +
                "time INTEGER NOT NULL, status TEXT NOT NULL, reason TEXT, is_contact INTEGER NOT NULL)"
        )
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    fun record(number: String, blocked: Boolean, isContact: Boolean, reason: String?) {
        val values =
            ContentValues().apply {
                put("number", number)
                put("time", System.currentTimeMillis())
                put("status", if (blocked) "blocked" else "incoming")
                put("reason", reason)
                put("is_contact", if (isContact) 1 else 0)
            }
        writableDatabase.beginTransaction()
        try {
            writableDatabase.insertOrThrow("calls", null, values)
            writableDatabase.execSQL(
                "DELETE FROM calls WHERE id NOT IN (SELECT id FROM calls ORDER BY id DESC LIMIT 500)"
            )
            writableDatabase.setTransactionSuccessful()
        } finally {
            writableDatabase.endTransaction()
        }
    }

    fun entries(): JSONArray {
        val result = JSONArray()
        readableDatabase.query("calls", null, null, null, null, null, "time DESC", "200").use {
            cursor ->
            while (cursor.moveToNext()) {
                result.put(
                    JSONObject().apply {
                        put("id", "screening_" + cursor.getLong(cursor.getColumnIndexOrThrow("id")))
                        put(
                            "number",
                            cursor.getString(cursor.getColumnIndexOrThrow("number")).ifEmpty {
                                "Número privado"
                            },
                        )
                        put("timestamp", cursor.getLong(cursor.getColumnIndexOrThrow("time")))
                        put("status", cursor.getString(cursor.getColumnIndexOrThrow("status")))
                        put(
                            "blockReason",
                            cursor.getString(cursor.getColumnIndexOrThrow("reason"))
                                ?: JSONObject.NULL,
                        )
                        put(
                            "isContact",
                            cursor.getInt(cursor.getColumnIndexOrThrow("is_contact")) == 1,
                        )
                        put("source", "screening")
                    }
                )
            }
        }
        return result
    }

    fun clear() {
        writableDatabase.delete("calls", null, null)
    }
}
