import { X } from '@phosphor-icons/react'
import styles from '../reportDetail.module.css'

export default function InternalEventModal({ 
  show, 
  onClose, 
  onSave, 
  form, 
  setForm, 
  isEditing, 
  isSubmitting 
}) {
  if (!show) return null

  return (
    <div className={styles.overlay} style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 2000 }}>
      <div className={`${styles.modal} ${styles.compactModal}`}>
        <div className={styles.modalHeader}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>{isEditing ? 'Chỉnh sửa' : 'Thêm'} hoạt động</h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={onSave}>
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tên hoạt động *</label>
              <input 
                className={styles.formInput} 
                required
                placeholder="Nhập tên hoạt động nội bộ..." 
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mô tả chi tiết</label>
              <textarea 
                className={styles.formInput} 
                placeholder="Nhập mô tả hoạt động..." 
                rows={3}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Địa điểm tổ chức</label>
              <input 
                className={styles.formInput} 
                placeholder="Nhập địa điểm..." 
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
              />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ngày diễn ra</label>
                <input 
                  type="date" 
                  className={styles.formInput} 
                  required
                  value={form.event_date}
                  onChange={e => setForm({...form, event_date: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số người tham gia</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={form.participant_count ?? ''}
                  onChange={e => {
                    const val = e.target.value;
                    setForm({...form, participant_count: val === '' ? null : parseInt(val)});
                  }}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.formLabel}>Link minh chứng (Drive, Folder...)</label>
                <input 
                  type="url"
                  className={styles.formInput} 
                  placeholder="https://drive.google.com/..."
                  value={form.evidence_url}
                  onChange={e => setForm({...form, evidence_url: e.target.value})}
                />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Hủy</button>
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  )
}
