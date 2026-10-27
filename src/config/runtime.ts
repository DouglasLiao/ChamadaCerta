import { parseRuntimeConfig } from './parseRuntimeConfig'

export const runtimeConfig = parseRuntimeConfig(import.meta.env)
