"use client"

import Modal from "./modal"

type ConfirmDialogProps = {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({ open, title = "Confirmar", description, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={(
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20">{cancelText}</button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-md bg-white text-black hover:bg-white/90">{confirmText}</button>
      </div>
    )}>
      {description && <p className="text-sm text-white/80">{description}</p>}
    </Modal>
  )
}
