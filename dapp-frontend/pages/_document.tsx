/* eslint-disable @next/next/no-sync-scripts */
import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';

export default class CustomDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);

    return initialProps;
  }
  render(): JSX.Element {
    return (
      <Html>
        <Head>
          <meta name="theme-color" content="#000000" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin={undefined} />
          <link href="https://fonts.googleapis.com/css2?family=Inter&family=Poppins&family=Syne&display=swap" rel="stylesheet" />
          <link rel="icon" href="/images/logo/logo.ico" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="description" content="The Vefi DApps is a product of the Vefi Ecosystem that houses commonly used decentralized platforms." />
          <meta name="robots" content="index, follow" />
          <meta
            name="keywords"
            content="dapps, vefi, dex, launchpad, multisig, staking pools, stake, bitgert, binance, brise, bsc, omax, gatechain, multichain"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
