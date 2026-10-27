package com.chamadacerta.app.domain

object DialNumber {
    private val formatting = Regex("[\\s().-]")
    private val dialable = Regex("\\+?[\\d*#]{1,30}")

    fun parse(input: String): String? {
        val number = input.trim().replace(formatting, "")
        return number.takeIf { it.matches(dialable) && it.any(Char::isDigit) }
    }
}
