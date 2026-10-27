package com.chamadacerta.app

import com.chamadacerta.app.domain.ProtectionPolicy
import org.junit.Assert.*
import org.junit.Test

class ProtectionPolicyTest {
    @Test
    fun contactsAlwaysAllowed() {
        assertFalse(ProtectionPolicy.shouldBlock(true, true, true))
    }

    @Test
    fun unknownBlockedOnlyWithAvailableContactsAndConsent() {
        assertTrue(ProtectionPolicy.shouldBlock(true, true, false))
    }

    @Test
    fun revokedOrFailedContactsAllowCalls() {
        assertFalse(ProtectionPolicy.shouldBlock(true, false, false))
    }

    @Test
    fun disabledPreferenceNeverBlocks() {
        assertFalse(ProtectionPolicy.shouldBlock(false, true, false))
    }
}
