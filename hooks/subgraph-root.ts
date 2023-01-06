import { request, gql } from 'graphql-request';

const chainNames: { [key: number]: string } = {
  137: 'polygon'
};

const rq = (chainId: number, subgraphName: string, query: string) =>
  request(
    `https://graph.vefinetwork.org/app/${chainNames[chainId] || 'bitgert'}/query/subgraphs/name/${subgraphName}/graphql/`,
    gql`
      ${query}
    `
  );

export default rq;
