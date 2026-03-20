import { useState } from 'react'
import { PATHS } from '../utils/routes'

function LoginPage({ isAuthenticated = false, user = null, onLogin, navigate }) {
  const [form, setForm] = useState({
    studentId: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
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

    if (!form.studentId.trim() || !form.password.trim()) {
      setStatus({
        loading: false,
        error: 'Vui lòng nhập đầy đủ mã sinh viên và mật khẩu.',
      })
      return
    }

    setStatus({
      loading: true,
      error: '',
    })

    try {
      await onLogin(form)
      navigate(PATHS.profile)
    } catch (error) {
      setStatus({
        loading: false,
        error: error.message,
      })
    }
  }

  if (isAuthenticated) {
    return (
      <section className="page-card auth-card auth-card-compact">
        <h1>Đăng nhập</h1>
        <p>
          Bạn đã đăng nhập với tài khoản <strong>{user?.studentId}</strong>.
        </p>
      </section>
    )
  }

  return (
    <section className="auth-view">
      <div className="auth-card auth-card-compact">
        <div className="auth-copy auth-copy-centered">
          <h1>Đăng nhập</h1>
          <p>Chào mừng bạn trở lại với hệ thống ĐTN.</p>
        </div>

        <form className="login-form auth-form" onSubmit={handleSubmit}>
          <label className="field field-full">
            <span>Tài khoản</span>
            <input
              name="studentId"
              type="text"
              value={form.studentId}
              onChange={handleChange}
              placeholder="Nhập mã sinh viên"
            />
          </label>

          <div className="auth-form-row">
            <span className="field-title">Mật khẩu</span>
            <button type="button" className="text-link auth-inline-link">
              Quên mật khẩu?
            </button>
          </div>

          <label className="field field-full">
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

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={status.loading}
          >
            {status.loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-divider">
          <span>HOẶC ĐĂNG NHẬP VỚI</span>
        </div>

        <div className="social-auth-list">
          <button type="button" className="social-auth-button">
            Google
          </button>
          <button type="button" className="social-auth-button">
            Facebook
          </button>
        </div>
      </div>

      <p className="auth-switch-copy">
        Chưa có tài khoản?{' '}
        <button
          type="button"
          className="text-link"
          onClick={() => navigate(PATHS.register)}
        >
          Đăng ký ngay
        </button>
      </p>
    </section>
  )
}

export default LoginPage
