import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Overview, SingleTokenView } from '../routes/analytics';

enum Routes {
  OVERVIEW = 'allStats',
  TOKEN = 'singleToken'
}

const useAnalyticsRoutes = (route: Routes) => {
  const [view, setView] = useState(() => Overview);

  useEffect(() => {
    switch (route) {
      case Routes.OVERVIEW:
        setView(() => Overview);
        break;
      case Routes.TOKEN:
        setView(() => SingleTokenView);
        break;
      default:
        setView(() => Overview);
        break;
    }
  }, [route]);
  return view;
};

export default function Analytics() {
  const { query } = useRouter();
  const route = useMemo(() => (query.view as Routes) || Routes.OVERVIEW, [query.view]);
  const RenderedView = useAnalyticsRoutes(route);
  return (
    <>
      <Head>
        <title>Vefi DApps | Analytics</title>
      </Head>
      <RenderedView />
    </>
  );
}