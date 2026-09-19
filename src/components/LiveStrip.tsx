import { useTranslation } from "react-i18next";
import { liveSignals } from "../data/mock";
export default function LiveStrip() { const { t } = useTranslation(); return <section className="live-strip" aria-label={t("signal.aria")}>{liveSignals.map((item) => <div key={item.labelKey}><span>{t(item.labelKey)}</span><b>{t(item.valueKey)}</b></div>)}</section>; }