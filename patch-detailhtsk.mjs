import fs from 'fs'

const p = './src/admin/tasks/DetailHTSK.jsx'
let s = fs.readFileSync(p, 'utf8')

s = s.replace(
  /<div className=\{u\.callout\} role="status">\s*Đơn vị chưa phản h��i sự kiện này\.\s*phản h��i\.\s*<\/div>/,
  `<div className={u.callout} role="status">
              ��ơn vị chưa phản h��i sự kiện này. Chọn trên bảng và/hoặc dán danh sách MSV (m��i dòng một mã). Khi bấm Tiếp
              tục, hệ thống tải toàn bộ thành viên đơn vị trong� để đối chiếu trư��c khi gửi.
            </div>`,
)

const pasteInsert = `
                <label className={u.pasteBlock} htmlFor="htsk-paste-msv">
                  <span className={u.pasteLabel}>Hoặc dán danh sách MSV (m��i dòng một mã)</span>
                  <textarea
                    id="htsk-paste-msv"
                    className={u.pasteTextarea}
                    value={pastedMsvText}
                    onChange={(e) => setPastedMsvText(e.target.value)}
                    placeholder={'B23DCCN002\\nB23DCCN003\\nB23DCCN004'}
                    rows={5}
                    spellCheck={false}
                  />
                </label>
`

const selectedBarOld = `                <div className={u.selectedBar}>
                  <�ã chọn: <strong>{selectedCount}</strong> đoàn viên
                  </span>`

const selectedBarNew = `${pasteInsert}
                <div className={u.selectedBar}>
                  <span>
                    Trên bảng: <strong>{selectedCount}</strong> · Dòng dán (không trùng):{' '}
                    <strong>{pastedLineCount}</�ớc tính sau gộp: <strong>{combinedPreviewCount}</strong>
                  </span>`

if (!s.includes('Đã chọn: <strong>{selectedCount}</strong> đoàn viên')) {
  throw new Error('selectedBar pattern missing')
}
s = s.replace(selectedBarOld, selectedBarNew)

const btnOld = `                      setContentDraft('')
                      setPageIndex(0)
                    }}
                    disabled={submitting}
                 �y
                  </button>
                  <button
                    type="button"
                    className={u.primaryBtn}
                    onClick={handleGoReview}
                    disabled={submitting || membersLoading || selectedCount === 0}
                  >
                    Tiếp tục ({selectedCount})
                  </button>`

const btnNew = `                      setContentDraft('')
                      setPageIndex(0)
                      setPastedMsvText('')
                      setRosterByStudentId(null)
                      setAddMsvInput('')
                    }}
                    disabled={submitting}
                  >
                    H��y
                  </button>
                  <button
                    type="button"
                    className={u.primaryBtn}
                    onClick={handleGoReview}
                    disabled={submitting || membersLoading || validatingReview || !canContinueToReview}
                  >
                    {validatingReview ? 'Đang tải & kiểm tra…' : \`Tiếp tục (\${combinedPreviewCount})\`}
                  </button>`

if (!s.includes('disabled={submitting || membersLoading || selectedCount === 0}')) {
  throw new Error('button pattern missing')
}
s = s.replace(btnOld, btnNew)

const reviewOld = `                <p className={u.reviewHint}>
                  Kiểm tra MSV đã chọn. Có thể g�� t��ng dòng nếu cần, r��i nhập nội dung phản h��i bên dư��i.
                </p>
                <div className={u.reviewTableWrap}>`

const reviewNew = `                <p className={u.reviewHint}>
                  Kiểm tra MSV đã chọn. Có thể g�� hoặc thêm mã mới (phải thuộc đơn vị trong học k��), r��i nhập nội dung
                  phản h��i�i.
                </p>
                <div className={u.addMsvRow}>
                  <input
                    type="text"
                    className={u.addMsvInput}
                    value={addMsvInput}
                    onChange={(e) => setAddMsvInput(e.target.value)}
                    placeholder="Thêm MSV…"
                    autoComplete="off"
                    aria-label="Thêm mã sinh viên"
                  />
                  <button type="button" className={u.secondaryBtn} onClick={handleAddMsvInReview} disabled={submitting}>
                    Thêm
                  </button>
                </div>
                <div className={u.reviewTableWrap}>`

if (!s.includes('Có thể gộp dòng nếu cần')) {
  throw new Error('review hint missing')
}
s = s.replace(reviewOld, reviewNew)

fs.writeFileSync(p, s, 'utf8')
console.log('patched ok')
