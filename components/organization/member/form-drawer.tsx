"use client"

import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog"
import { MemberFormContainer } from "./form/member-form-container"

interface MemberFormDrawerProps {
  children?: React.ReactNode
  organizationId: string
  existingMemberId?: string
  onSuccess?: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
  onClose?: () => void
  organizationName?: string
}

export function MemberFormDrawer({
  children,
  organizationId,
  existingMemberId,
  onSuccess,
  isOpen,
  onOpenChange,
  open,
  onClose
}: MemberFormDrawerProps) {
  const actualIsOpen = isOpen !== undefined ? isOpen : open
  const actualOnOpenChange = onOpenChange || ((newOpen: boolean) => {
    if (onClose && !newOpen) onClose()
  })

  return (
    <Dialog open={actualIsOpen} onOpenChange={actualOnOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogTitle className="sr-only">
          {existingMemberId ? "Editar Membro" : "Novo Membro"}
        </DialogTitle>
        <div className="overflow-y-auto flex-1">
          <MemberFormContainer
            organizationId={organizationId}
            existingMemberId={existingMemberId}
            onSuccess={onSuccess}
            onCancel={() => actualOnOpenChange?.(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}