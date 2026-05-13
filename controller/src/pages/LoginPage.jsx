import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Login page — email/password form. Authentication is not yet implemented. */
export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  /** @param {React.FormEvent} e */
  function handleSubmit(e) {
    e.preventDefault()
    navigate('/')
  }

  return (
    <div className="login-page">
      <div className="login-wave">
        <svg className="login-wave--front" viewBox="0 0 393 541" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M393 14.9941C393 14.9941 333.5 45.7582 276.5 45.7582C219.5 45.7582 158.5 0.000291481 98.5 4.6244e-09C38.5 -0.000291471 0 13.7783 0 13.7783V541H393V14.9941Z" fill="var(--wave-front)"/>
        </svg>
        <svg className="login-wave--back" viewBox="0 0 394 745" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M-3 3.68669e-09C-3 3.68669e-09 49 27.6227 106 27.6227C163 27.6227 223 6.74748 283 6.74707C343 6.74666 394 34.5999 394 34.5999L390 744.247H-3V3.68669e-09Z" fill="var(--wave-back)"/>
        </svg>
      </div>
      <section className="login-hero">
        <div className="login-logo">
          <span className="login-logo__sub">{t('loginPage.guidesIn')}</span>
          <span className="login-logo__city">{t('loginPage.city')}</span>
        </div>
      </section>

      <section className="login-panel">
        <h1 className="login-card__heading">{t('loginPage.title')}</h1>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-field__label" htmlFor="email">
              {t('loginPage.email')}
            </label>
            <input
              id="email"
              className="login-field__input"
              type="email"
              placeholder={t('loginPage.emailPlaceholder')}
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label className="login-field__label" htmlFor="password">
              {t('loginPage.password')}
            </label>

            <div className="login-field__password-wrap">
              <input
                id="password"
                className="login-field__input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="login-field__eye"
                aria-label={
                  showPassword
                    ? t('loginPage.hidePassword')
                    : t('loginPage.showPassword')
                }
                onClick={() => setShowPassword(v => !v)}
              >
                <span className="ms">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            <button type="button" className="login-forgot">
              {t('loginPage.forgotPassword')}
            </button>
          </div>
          <button type="submit" className="fab login-submit">
            {t('loginPage.submit')}
          </button>
        </form>

        <p className="login-signup">
          {t('loginPage.noAccount')}{' '}
          <button type="button" className="login-signup__link">
            {t('loginPage.signUp')}
          </button>
        </p>
      </section>
    </div>
  )
}