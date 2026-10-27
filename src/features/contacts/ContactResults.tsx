import { memo, useState } from 'react'
import { Pencil, Phone } from 'lucide-react'
import type { ContactGroup } from '../../domain/contactDirectory'
import { CallAction } from '../phone/CallAction'
import { runtimeConfig } from '../../config/runtime'

const CONTACT_PAGE_SIZE = runtimeConfig.contactPageSize
const RECORD_PAGE_SIZE = runtimeConfig.contactRecordPageSize

function ContactRow({
  group,
  onEdit,
  disabled,
}: {
  group: ContactGroup
  onEdit: (id: string) => void
  disabled: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [recordPage, setRecordPage] = useState(0)
  const contact = group.primary
  const multiple = group.members.length > 1
  const page = Math.min(recordPage, Math.ceil(group.members.length / RECORD_PAGE_SIZE) - 1)
  return (
    <li className="cc-contact-item">
      <div className="cc-row">
        <span className="cc-avatar" aria-hidden="true">
          {contact.name.charAt(0)}
        </span>
        <div className="cc-row-text">
          <strong>{contact.name}</strong>
          <p>{contact.number}</p>
          {multiple && <p>{group.members.length} registros agrupados</p>}
        </div>
        <button
          aria-label={
            multiple ? `Escolher cadastro de ${contact.name} para editar` : `Editar ${contact.name}`
          }
          aria-expanded={multiple ? expanded : undefined}
          disabled={disabled}
          onClick={() => (multiple ? setExpanded(!expanded) : onEdit(contact.id))}
        >
          <Pencil size={20} aria-hidden="true" />
        </button>
        <CallAction number={contact.number} label={`Ligar para ${contact.name}`}>
          <Phone size={20} />
        </CallAction>
      </div>
      {multiple && expanded && (
        <div className="cc-contact-records">
          <p>Escolha o cadastro para abrir no editor de contatos do Android.</p>
          <ul aria-label={`Cadastros de ${contact.name}`}>
            {group.members
              .slice(page * RECORD_PAGE_SIZE, (page + 1) * RECORD_PAGE_SIZE)
              .map((member) => (
                <li key={member.id}>
                  <span>
                    {member.name}
                    <small>{member.number}</small>
                  </span>
                  <button
                    disabled={disabled}
                    onClick={() => onEdit(member.id)}
                    aria-label={`Editar cadastro ${member.name}, ${member.number}`}
                  >
                    Editar
                  </button>
                </li>
              ))}
          </ul>
          {group.members.length > RECORD_PAGE_SIZE && (
            <div className="cc-pagination">
              <button disabled={page === 0} onClick={() => setRecordPage(page - 1)}>
                Cadastros anteriores
              </button>
              <button
                disabled={(page + 1) * RECORD_PAGE_SIZE >= group.members.length}
                onClick={() => setRecordPage(page + 1)}
              >
                Próximos cadastros
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export const ContactResults = memo(function ContactResults({
  groups,
  onEdit,
  disabled,
}: {
  groups: readonly ContactGroup[]
  onEdit: (id: string) => void
  disabled: boolean
}) {
  const [requestedPage, setPage] = useState(0)
  const page = Math.min(
    requestedPage,
    Math.max(0, Math.ceil(groups.length / CONTACT_PAGE_SIZE) - 1),
  )
  const start = page * CONTACT_PAGE_SIZE
  return (
    <>
      <p className="cc-help" role="status">
        {start + 1}–{Math.min(start + CONTACT_PAGE_SIZE, groups.length)} de {groups.length} números
      </p>
      <ul className="cc-list" aria-label="Contatos encontrados">
        {groups.slice(start, start + CONTACT_PAGE_SIZE).map((group) => (
          <ContactRow key={group.key} group={group} onEdit={onEdit} disabled={disabled} />
        ))}
      </ul>
      {groups.length > CONTACT_PAGE_SIZE && (
        <nav className="cc-pagination" aria-label="Páginas de contatos">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Anteriores
          </button>
          <span>
            Página {page + 1} de {Math.ceil(groups.length / CONTACT_PAGE_SIZE)}
          </span>
          <button
            disabled={start + CONTACT_PAGE_SIZE >= groups.length}
            onClick={() => setPage(page + 1)}
          >
            Próximos
          </button>
        </nav>
      )}
    </>
  )
})
