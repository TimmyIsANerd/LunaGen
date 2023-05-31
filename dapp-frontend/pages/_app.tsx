import '../styles/global.css';
import 'react-toastify/dist/ReactToastify.css';
import 'moment';
import 'moment-timezone';
import type { AppProps } from 'next/app';
import { Web3ReactProvider } from '@web3-react/core';
import Web3 from 'web3';
import { GoogleAnalytics } from 'nextjs-google-analytics';
import Header from '../ui/Header';
import { DEXSettingsContextProvider } from '../contexts/dex/settings';
import { Web3ContextProvider } from '../contexts/web3';
import { GQLProvider } from '../contexts/graphql';

function getLibrary(provider: any) {
  return new Web3(provider);
}

const AppContent = ({ children }: any) => {
  return (
    <div className="bg-[#063230] min-h-screen scroll-smooth flex flex-col w-screen overflow-hidden relative">
      <Header />
      <div className="overflow-auto flex-1">{children}</div>
      {/* <Footer /> */}
    </div>
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <GoogleAnalytics gaMeasurementId={process.env.NEXT_PUBLIC_GA_KEY} trackPageViews />
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ContextProvider>
          <GQLProvider>
            <DEXSettingsContextProvider>
              <AppContent>
                <Component {...pageProps} />
              </AppContent>
            </DEXSettingsContextProvider>
          </GQLProvider>
        </Web3ContextProvider>
      </Web3ReactProvider>
    </>
  );
}
