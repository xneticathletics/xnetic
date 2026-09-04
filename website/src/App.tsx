import { useEffect, useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Roles from "./components/Roles";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import Faq from "./components/Faq";
import CtaBanner from "./components/CtaBanner";
import Footer from "./components/Footer";
import { getPlatformSettings, type PlatformSettings } from "./lib/platformSettings";

export default function App() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlatformSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header />
      <main>
        <Hero />
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
