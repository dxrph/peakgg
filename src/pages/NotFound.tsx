import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function NotFound() {
  const { t } = useTranslation();
  return <main className="not-found"><p>404</p><h1>{t("notFound.title")}</h1><Link className="site-nav-cta" to="/">{t("notFound.back")}</Link></main>;
}
