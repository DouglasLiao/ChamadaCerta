package com.chamadacerta.app.domain

/** No heuristics or network in the decision path. Unavailable contacts always allow. */
object ProtectionPolicy {
    fun shouldBlock(enabled: Boolean, contactsAvailable: Boolean, isContact: Boolean): Boolean =
        enabled && contactsAvailable && !isContact
}
