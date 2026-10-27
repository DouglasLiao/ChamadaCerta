import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { DeviceGateway } from '../application/ports/DeviceGateway'
import { createDeviceCommands } from '../application/createDeviceCommands'
import { useDeviceState } from './useDeviceState'
import { createContactDirectory } from '../domain/contactDirectory'
type AppState = ReturnType<typeof useDeviceState> & {
  commands: ReturnType<typeof createDeviceCommands>
  contactDirectory: ReturnType<typeof createContactDirectory>
}
const AppContext = createContext<AppState | null>(null)
export function AppProvider({
  children,
  gateway,
}: {
  children: ReactNode
  gateway: DeviceGateway
}) {
  const device = useDeviceState(gateway)
  const contactDirectory = useMemo(() => createContactDirectory(device.contacts), [device.contacts])
  const commands = useMemo(
    () =>
      createDeviceCommands(
        gateway,
        !!device.status?.callPermission,
        !!device.status?.writeContactsPermission,
      ),
    [gateway, device.status?.callPermission, device.status?.writeContactsPermission],
  )
  return (
    <AppContext.Provider value={{ ...device, commands, contactDirectory }}>
      {children}
    </AppContext.Provider>
  )
}
export function useApp() {
  const device = useContext(AppContext)
  if (!device) throw new Error('useApp deve ser usado dentro de AppProvider.')
  return device
}
