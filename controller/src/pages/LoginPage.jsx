import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/** Login page — email/password form. Auth is stubbed until saas-adapter signIn is wired up. */
export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // TODO (deploy): await signIn(email, password) from saas-adapter, then navigate on success
    navigate('/')
  }

  return (
    <div className="login-page">

      {/* Logotyp – övre halvan */}
      <div className="login-top">
        <div className="login-logo">
          <span className="login-logo__sub">{t('loginPage.guidesIn')}</span>
          <span className="login-logo__city">{t('loginPage.city')}</span>
        </div>
      </div>

  

      {/* Våg som smälter in med formuläret */}
      <svg className="login-wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
        <rect width="1440" height="320" fill="var(--color-button)" />
        <path fill="var(--color-background)" d="M0,32L48,26.7C96,21,192,11,288,26.7C384,43,480,85,576,128C672,171,768,213,864,240C960,267,1056,277,1152,266.7C1248,256,1344,224,1392,208L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
      </svg>

      {/* Formulär – nedre halvan */}
      <div className="login-bottom">
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
                aria-label={showPassword ? t('loginPage.hidePassword') : t('loginPage.showPassword')}
                onClick={() => setShowPassword(v => !v)}
              >
                <span className="ms">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <button type="button" className="login-forgot">
              {t('loginPage.forgotPassword')}
            </button>
          </div>

          <button type="submit" className="efab login-submit">
            {t('loginPage.submit')}
          </button>
        </form>

        <p className="login-signup">
          {t('loginPage.noAccount')}{' '}
          <button type="button" className="login-signup__link">
            {t('loginPage.signUp')}
          </button>
        </p>
      </div>
    </div>
  )
}
