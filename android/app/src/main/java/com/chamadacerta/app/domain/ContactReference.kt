package com.chamadacerta.app.domain

object ContactReference {
    fun dataId(reference: String): Long {
        require(reference.matches(Regex("device_[1-9][0-9]{0,18}"))) {
            "Referência de contato inválida. Atualize a agenda."
        }
        return requireNotNull(reference.removePrefix("device_").toLongOrNull()) {
            "Referência de contato inválida. Atualize a agenda."
        }
    }
}
