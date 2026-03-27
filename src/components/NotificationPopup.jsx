function NotificationPopup({
  isOpen,
  title = 'Thông báo',
  message,
  tone = 'error',
  onClose,
}) {
  if (!isOpen || !message) {
    return null
  }

  return (
    <div className="notification-popup-backdrop" role="presentation">
      <div
        className={`notification-popup notification-popup-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="notification-popup-title"
      >
        <div className="notification-popup-header">
          <h2 id="notification-popup-title">{title}</h2>
          <button
            type="button"
            className="notification-popup-close"
            aria-label="Đóng thông báo"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p>{message}</p>
        <button
          type="button"
          className="primary-button notification-popup-action"
          onClick={onClose}
        >
          Đã hiểu
        </button>
      </div>
    </div>
  )
}

export default NotificationPopup
