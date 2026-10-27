package com.chamadacerta.app.domain

data class ContactDraft(val name: String, val number: String) {
    companion object {
        fun validate(name: String, number: String): ContactDraft {
            val cleanName = name.trim()
            require(cleanName.isNotEmpty() && cleanName.length <= 120) {
                "Informe um nome de até 120 caracteres."
            }
            val cleanNumber =
                DialNumber.parse(number)
                    ?: throw IllegalArgumentException("Confira o telefone do contato.")
            return ContactDraft(cleanName, cleanNumber)
        }
    }
}
