package com.chamadacerta.app.domain

import org.junit.Assert.*
import org.junit.Test

class ContactDraftTest {
    @Test
    fun trimsNameAndNormalizesPhoneFormatting() {
        assertEquals(
            ContactDraft("Pessoa", "+5511988881234"),
            ContactDraft.validate("  Pessoa  ", "+55 (11) 98888-1234"),
        )
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsBlankNames() {
        ContactDraft.validate(" ", "11988881234")
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsOversizedNames() {
        ContactDraft.validate("a".repeat(121), "11988881234")
    }

    @Test(expected = IllegalArgumentException::class)
    fun rejectsInvalidPhoneValues() {
        ContactDraft.validate("Pessoa", "javascript:alert(1)")
    }
}
