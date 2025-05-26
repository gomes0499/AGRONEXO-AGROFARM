"use client"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
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
    <Sheet open={actualIsOpen} onOpenChange={actualOnOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent className="max-w-2xl w-full sm:max-w-2xl overflow-y-auto">
        <MemberFormContainer
          organizationId={organizationId}
          existingMemberId={existingMemberId}
          onSuccess={onSuccess}
          onCancel={() => actualOnOpenChange?.(false)}
        />
      </SheetContent>
    </Sheet>
  )
}