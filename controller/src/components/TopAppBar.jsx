import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Reusable top app bar with optional back button and settings button.
 * @param {{ title: string, onBack?: Function, showSettings?: boolean }} props
 */
export default function TopAppBar({ title, onBack, showSettings = true }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="top-app-bar">
      <div className="top-app-bar__actions">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label={t("nav.back")}>
            <span className="ms">arrow_back</span>
          </button>
        ) : (
          <div className="icon-btn" />
        )}

        {showSettings ? (
          <button className="icon-btn" onClick={() => navigate("/settings")} aria-label={t("nav.settings")}>
            <span className="ms">settings</span>
          </button>
        ) : (
          <div className="icon-btn" />
        )}
      </div>

      <span className="top-app-bar__title">{title}</span>
    </div>
  );
}
