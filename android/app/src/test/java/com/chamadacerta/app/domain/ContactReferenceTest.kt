package com.chamadacerta.app.domain

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class ContactReferenceTest {
    @Test
    fun parsesOnlyPositiveDataIds() {
        assertEquals(123L, ContactReference.dataId("device_123"))
        assertEquals(Long.MAX_VALUE, ContactReference.dataId("device_9223372036854775807"))
    }

    @Test
    fun rejectsUrisInvalidIdsAndOverflow() {
        listOf(
                "",
                "device_0",
                "device_-1",
                "device_01",
                "device_1 OR 1=1",
                "content://contacts/1",
                "device_9223372036854775808",
            )
            .forEach { reference ->
                assertThrows(IllegalArgumentException::class.java) {
                    ContactReference.dataId(reference)
                }
            }
    }
}
