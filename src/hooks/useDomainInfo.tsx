import {
  ANT,
  AOProcess,
  AoANTInfo,
  AoANTRead,
  AoANTRecord,
  AoANTState,
  AoANTWrite,
  AoARIORead,
  AoArNSNameData,
} from '@ar.io/sdk/web';
import { connect } from '@permaweb/aoconnect';
import { captureException } from '@sentry/react';
import { isInGracePeriod } from '@src/components/layout/Navbar/NotificationMenu/NotificationMenu';
import { useGlobalState } from '@src/state/contexts/GlobalState';
import { useWalletState } from '@src/state/contexts/WalletState';
import { ArNSWalletConnector } from '@src/types';
import { jsonSerialize } from '@src/utils';
import { ARWEAVE_HOST, NETWORK_DEFAULTS } from '@src/utils/constants';
import { ANTStateError, UpgradeRequiredError } from '@src/utils/errors';
import {
  buildAntStateQuery,
  buildArNSRecordsQuery,
  queryClient,
} from '@src/utils/network';
import { useQuery } from '@tanstack/react-query';
import { TransactionEdge } from 'arweave-graphql';
import { Tag } from 'arweave/node/lib/transaction';

import { buildGraphQLQuery } from './useGraphQL';

export type DomainInfo = {
  info: AoANTInfo | null;
  arnsRecord?: AoArNSNameData;
  associatedNames: string[];
  processId: string;
  antProcess: AoANTWrite | AoANTRead;
  name: string;
  ticker: string;
  owner: string;
  controllers: string[];
  logo: string;
  undernameCount?: number;
  sourceCodeTxId?: string;
  apexRecord: {
    transactionId: string;
    ttlSeconds: number;
  };
  records: Record<string, AoANTRecord>;
  state: AoANTState | null;
  isInGracePeriod?: boolean;
  processMeta: TransactionEdge['node'] | null;
  errors: Error[];
};

export function buildDomainInfoQuery({
  domain,
  antId,
  arioContract,
  arioProcessId,
  aoNetwork,
  wallet,
  gateway = ARWEAVE_HOST,
}: {
  domain?: string;
  antId?: string;
  arioContract?: AoARIORead;
  arioProcessId?: string;
  gateway?: string;
  aoNetwork: typeof NETWORK_DEFAULTS.AO;
  wallet?: ArNSWalletConnector;
}): Parameters<typeof useQuery<DomainInfo>>[0] {
  return {
    // we are verbose here to enable predictable keys. Passing in the entire params as a single object can have unpredictable side effects
    queryKey: [
      'domainInfo',
      domain,
      antId,
      arioContract,
      arioProcessId,
      aoNetwork,
    ],
    queryFn: async () => {
      const action = 'Set-Record';
      const errors: Error[] = [];
      const antAo = connect(aoNetwork.ANT);

      const arnsRecords =
        domain && arioContract && arioProcessId
          ? await queryClient.fetchQuery(
              buildArNSRecordsQuery({
                arioContract,
                meta: [arioProcessId, aoNetwork.ARIO.CU_URL],
              }),
            )
          : undefined;

      if (!domain && !antId) {
        throw new Error('No domain or antId provided');
      }

      const record = domain && arnsRecords ? arnsRecords[domain] : undefined;

      if (!antId && !record?.processId) {
        throw new Error('No ANT id or record found');
      }
      const processId = antId || record?.processId;
      const signer = wallet?.contractSigner;

      if (!processId) {
        throw new Error('No processId found');
      }

      const antProcess = ANT.init({
        process: new AOProcess({
          processId,
          ao: antAo,
        }),
        ...(signer !== undefined ? { signer: signer as any } : {}),
      });

      const state = await queryClient
        .fetchQuery(buildAntStateQuery({ processId, ao: antAo }))
        .catch((e) => {
          captureException(e);
          errors.push(
            new ANTStateError(
              e?.message ?? 'Unknown Error - Unable to fetch ANT state',
            ),
          );
          return null;
        });

      const info = await queryClient.fetchQuery({
        queryKey: ['ant-info', processId],
        queryFn: async () => {
          try {
            const drySetRecordRes = await antAo
              .dryrun({
                process: processId,
                Owner: state?.Owner,
                From: state?.Owner,
                tags: [
                  { name: 'Action', value: action },
                  { name: 'TTL-Seconds', value: '86400' },
                  { name: 'Transaction-Id', value: ''.padEnd(43, '1') },
                  { name: 'Sub-Domain', value: '1' },
                  { name: 'Priority', value: '1' },
                ],
              })
              .catch(() => {
                return {} as ReturnType<typeof antAo.dryrun>;
              });
            const maybeError = drySetRecordRes?.Messages?.find((msg) => {
              return msg?.Tags?.find((t: Tag) => t.name === 'Error');
            });

            const priority: number | undefined =
              drySetRecordRes?.Messages?.find((msg) => {
                return jsonSerialize(msg.Data)?.priority;
              });

            if (maybeError !== undefined || !priority) {
              errors.push(new UpgradeRequiredError(`Affected APIs: ${action}`));
            }

            const info = await ANT.init({
              process: new AOProcess({ processId, ao: antAo }),
            }).getInfo();
            if (errors.length) info.Handlers = []; // for validation on api's, in order to update ant
            return info;
          } catch (error: any) {
            captureException(error);
            errors.push(
              new Error(error?.message ?? 'Unknown Error fetching ANT Info'),
            );
            return null;
          }
        },
        staleTime: Infinity,
      });

      const processMeta = await queryClient
        .fetchQuery(buildGraphQLQuery(gateway, { ids: [processId] }))
        .then((res) => res?.transactions.edges[0].node)
        .catch((e) => {
          console.error(e);
          return null;
        });

      const associatedNames = arnsRecords
        ? Object.entries(arnsRecords)
            .filter(([, r]) => r.processId == processId.toString())
            .map(([d]) => d)
        : [];

      const {
        Name: name,
        Ticker: ticker,
        Owner: owner,
        Controllers: controllers,
        Records: records,
      } = state ?? {};
      const apexRecord = records?.['@'];
      const undernameCount = Object.keys(records ?? {}).filter(
        (k) => k !== '@',
      ).length;

      return {
        info,
        arnsRecord: record,
        associatedNames,
        processId,
        antProcess,
        name,
        ticker,
        owner,
        controllers,
        logo: state?.Logo ?? '',
        undernameCount,
        apexRecord,
        records: state?.Records,
        state,
        errors,
        // TODO: staletime for this hook can be configured around the endTimestamp on the record
        isInGracePeriod: record ? isInGracePeriod(record) : false,
        processMeta,
      } as DomainInfo;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity,
    enabled: !!(domain || antId),
  };
}

export default function useDomainInfo({
  domain,
  antId,
}: {
  domain?: string;
  antId?: string;
}) {
  const [{ arioContract, arioProcessId, aoNetwork, gateway }] =
    useGlobalState();
  const [{ wallet }] = useWalletState();

  // TODO: this should be modified or removed
  const query = useQuery(
    buildDomainInfoQuery({
      domain,
      antId,
      aoNetwork,
      arioContract,
      arioProcessId,
      wallet,
      gateway,
    }),
  );

  return {
    ...query,
    refetch: () => {
      queryClient.resetQueries({
        queryKey: ['domainInfo', antId],
      });
      queryClient.resetQueries({
        queryKey: ['domainInfo', domain],
      });
      queryClient.resetQueries({
        queryKey: ['ant', antId],
      });
      queryClient.resetQueries({
        queryKey: ['ant-info', antId],
      });
    },
  };
}
