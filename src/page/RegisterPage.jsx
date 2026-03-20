import { useState } from 'react'
import { registerUser } from '../service/userService'
import { PATHS } from '../utils/routes'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  studentId: '',
  className: '',
}

function RegisterPage({ navigate }) {
  const [form, setForm] = useState(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
  })

  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.studentId.trim() ||
      !form.className.trim()
    ) {
      setStatus({
        loading: false,
        error: 'Vui lòng nhập đầy đủ các trường bắt buộc.',
        success: '',
      })
      return
    }

    setStatus({
      loading: true,
      error: '',
      success: '',
    })

    try {
      await registerUser(form)
      setForm(initialForm)
      setStatus({
        loading: false,
        error: '',
        success: 'Tạo tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.',
      })
    } catch (error) {
      setStatus({
        loading: false,
        error: error.message,
        success: '',
      })
    }
  }

  return (
    <section className="register-view">
      <div className="register-card">
        <div className="register-copy">
          <h1>Tham gia ĐTN</h1>
          <p>Bắt đầu hành trình của bạn với cộng đồng số.</p>
        </div>

        <form className="register-form register-form-card" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Họ và Tên</span>
            <input
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
            />
          </label>

          <label className="field field-full">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@vi-du.com"
            />
          </label>

          <label className="field">
            <span>Tài khoản</span>
            <input
              name="studentId"
              type="text"
              value={form.studentId}
              onChange={handleChange}
              placeholder="Nhập mã sinh viên"
            />
          </label>

          <label className="field">
            <span>Tên lớp</span>
            <input
              name="className"
              type="text"
              value={form.className}
              onChange={handleChange}
              placeholder="K68-CNTT"
            />
          </label>

          <label className="field field-full">
            <span>Mật khẩu</span>
            <div className="password-field">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="icon-button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                onClick={() => setShowPassword((current) => !current)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
              </button>
            </div>
          </label>

          {status.error && <p className="form-error field-full">{status.error}</p>}
          {status.success && (
            <p className="form-success field-full">{status.success}</p>
          )}

          <button
            type="submit"
            className="primary-button register-submit field-full"
            disabled={status.loading}
          >
            {status.loading ? 'Đang đăng ký...' : 'Đăng ký →'}
          </button>
        </form>

        <p className="register-login-link">
          Bạn đã có tài khoản?{' '}
          <button
            type="button"
            className="text-link"
            onClick={() => navigate(PATHS.login)}
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>

      <footer className="register-footer">
        <div>
          <strong>ĐTN</strong>
          <p>© 2024 Dự án ĐTN. Tất cả quyền được bảo lưu.</p>
        </div>
        <div className="register-footer-links">
          <button type="button" className="footer-link">
            Điều khoản
          </button>
          <button type="button" className="footer-link">
            Bảo mật
          </button>
          <button type="button" className="footer-link">
            Liên hệ
          </button>
        </div>
      </footer>
    </section>
  )
}

export default RegisterPage
