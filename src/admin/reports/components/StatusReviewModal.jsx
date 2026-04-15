import { X } from '@phosphor-icons/react'
import styles from '../reportDetail.module.css'

export default function StatusReviewModal({ 
  show, 
  onClose, 
  onConfirm, 
  reviewNote, 
  setReviewNote, 
  isSubmitting 
}) {
  if (!show) return null

  return (
    <div className={styles.overlay} style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 2000 }}>
      <div className={`${styles.modal} ${styles.compactModal}`}>
        <div className={styles.modalHeader}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>Yêu cầu chỉnh sửa</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>
        <div className={styles.formBody}>
          <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.95rem' }}>
            Vui lòng cung cấp lý do hoặc các nội dung cần sửa đổi để đơn vị nắm bắt thông tin.
          </p>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Ghi chú phản hồi *</label>
            <textarea 
              className={styles.formInput} 
              rows={4}
              placeholder="Nhập nội dung phản hồi cho đơn vị..."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Hủy</button>
          <button 
            className={`${styles.saveBtn} ${styles.dangerBtn}`} 
            onClick={onConfirm}
            disabled={!reviewNote.trim() || isSubmitting}
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  )
}
