function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  isSubmitting = false,
  onConfirm,
  onClose,
  danger = false,
}) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-dialog-header">
          <h2 id="confirm-dialog-title">{title}</h2>
          <button
            type="button"
            className="notification-popup-close"
            aria-label="Đóng hộp thoại xác nhận"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p>{message}</p>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'danger-button' : 'primary-button'}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
