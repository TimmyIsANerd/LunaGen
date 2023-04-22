import '../styles/global.css';
import 'react-toastify/dist/ReactToastify.css';
import 'moment';
import type { AppProps } from 'next/app';
import { Web3ReactProvider } from '@web3-react/core';
import Web3 from 'web3';
import { GoogleAnalytics } from 'nextjs-google-analytics';
import Header from '../components/Header';
import { DEXSettingsContextProvider } from '../contexts/dex/settings';
import { Web3ContextProvider } from '../contexts/web3';
import { APIContextProvider } from '../contexts/api';

function getLibrary(provider: any) {
  return new Web3(provider);
}

const AppContent = ({ children }: any) => {
  return (
    <div className="bg-[#063230] h-screen scroll-smooth flex flex-col w-screen overflow-hidden">
      <Header />
      <div className="overflow-auto flex-1 backdrop-opacity-10 backdrop-invert bg-[#063230]">{children}</div>
    </div>
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GoogleAnalytics gaMeasurementId={process.env.NEXT_PUBLIC_GA_KEY} trackPageViews />
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ContextProvider>
          <DEXSettingsContextProvider>
            <APIContextProvider>
              <AppContent>
                <Component {...pageProps} />
              </AppContent>
            </APIContextProvider>
          </DEXSettingsContextProvider>
        </Web3ContextProvider>
      </Web3ReactProvider>
    </>
  );
}
