import { useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Features from "./components/Features";
import Roles from "./components/Roles";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import Faq from "./components/Faq";
import CtaBanner from "./components/CtaBanner";
import Footer from "./components/Footer";
import KvkkPage from "./components/KvkkPage";
import ServicePage from "./components/ServicePage";
import { getPlatformSettings, type PlatformSettings } from "./lib/platformSettings";
import { getServiceBySlug } from "./lib/services";

export default function App() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Tek sayfalık site (router yok) — istisnalar /kvkk ve /hizmet/<slug>.
  // vercel.json zaten her yolu index.html'e yönlendiriyor, bu yüzden bu
  // basit pathname kontrolü yeterli, ayrı bir router bağımlılığı eklemeye
  // gerek yok. Sayfalar arası geçiş normal <a> linkleriyle tam sayfa
  // yenilemesi ile oluyor, bu yüzden pathname'i sadece ilk render'da
  // okumak yeterli — bir dinleyiciye gerek yok.
  const { pathname } = window.location;
  if (pathname === "/kvkk") {
    return <KvkkPage settings={settings} />;
  }
  if (pathname.startsWith("/hizmet/")) {
    const service = getServiceBySlug(pathname.slice("/hizmet/".length));
    if (service) {
      return <ServicePage service={service} settings={settings} />;
    }
  }

  return (
    <div>
      <Header />
      <main>
        <Hero />
        <About />
        <Features />
        <Roles />
        <HowItWorks />
        <Pricing settings={settings} loading={loading} />
        <Faq />
        <CtaBanner />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
