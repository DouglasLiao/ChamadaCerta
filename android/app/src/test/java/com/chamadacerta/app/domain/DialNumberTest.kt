package com.chamadacerta.app.domain

import org.junit.Assert.*
import org.junit.Test

class DialNumberTest {
    @Test
    fun acceptsFormattedPhoneNumbers() {
        assertEquals("+5511988881234", DialNumber.parse("+55 (11) 98888-1234"))
    }

    @Test
    fun preservesServiceCodesForSystemDialer() {
        assertEquals("*#06#", DialNumber.parse("*#06#"))
    }

    @Test
    fun rejectsInjectedOrAmbiguousInput() {
        assertNull(DialNumber.parse("javascript:alert(1)"))
        assertNull(DialNumber.parse("12+34"))
        assertNull(DialNumber.parse("***"))
        assertNull(DialNumber.parse("1".repeat(31)))
    }
}
