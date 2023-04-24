import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useGlobalState } from '../../../state/contexts/GlobalState';
import {
  AntInteraction,
  ArNSMapping,
  ArweaveTransactionID,
  ContractType,
  RegistryInteraction,
  TransactionData,
} from '../../../types';
import { WARP_CONTRACT_BASE_URL } from '../../../utils/constants';
import { getArNSMappingByInteractionType } from '../../../utils/transactionUtils/transactionUtils';
import { AntCard } from '../../cards';
import { ArrowUpRight } from '../../icons';

function TransactionComplete({
  transactionId,
  contractType,
  interactionType,
  transactionData,
}: {
  transactionId?: ArweaveTransactionID;
  contractType: ContractType;
  interactionType: AntInteraction | RegistryInteraction;
  transactionData: TransactionData;
}) {
  const [{}, dispatchGlobalState] = useGlobalState(); // eslint-disable-line
  const [antCardProps] = useState<ArNSMapping>(() =>
    getArNSMappingByInteractionType({
      contractType,
      interactionType,
      transactionData,
    }),
  );

  return (
    <>
      <div className="flex-column center" style={{ gap: '3em' }}>
        <div className="flex-column center" style={{ gap: '2em' }}>
          {/* TODO: configure error or fail states */}
          <AntCard {...antCardProps} />
          <div
            className="flex flex-row center"
            style={{ gap: '1em', maxWidth: '782px' }}
          >
            <Link
              to="/create"
              className="link"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="flex flex-column center card"
                style={{
                  minWidth: '175px',
                  minHeight: '100px',
                  flex: 1,
                  padding: '0px',
                  gap: '.5em',
                  textDecoration: 'none',
                }}
              >
                <ArrowUpRight
                  width={'30px'}
                  height={'30px'}
                  fill={'var(--text-white)'}
                />
                <span className="flex text-small faded center">
                  Register a Name
                </span>
              </div>
            </Link>

            {transactionId ? (
              <Link
                rel="noreferrer"
                target={'_blank'}
                to={`${WARP_CONTRACT_BASE_URL}${transactionId.toString()}`}
                className="link"
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="flex flex-column center card"
                  style={{
                    minWidth: '175px',
                    minHeight: '100px',
                    flex: 1,
                    padding: '0px',
                    gap: '.5em',
                    textDecoration: 'none',
                  }}
                >
                  <ArrowUpRight
                    width={'30px'}
                    height={'30px'}
                    fill={'var(--text-white)'}
                  />
                  <span
                    className="flex text-small faded center"
                    style={{ textDecorationLine: 'none' }}
                  >
                    View on Sonar
                  </span>
                </div>
              </Link>
            ) : (
              <></>
            )}

            <Link
              to={`/manage/ants/${transactionData.assetId}`}
              className="link"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="flex flex-column center card"
                style={{
                  minWidth: '175px',
                  minHeight: '100px',
                  flex: 1,
                  padding: '0px',
                  gap: '.5em',
                  textDecoration: 'none',
                }}
              >
                <ArrowUpRight
                  width={'30px'}
                  height={'30px'}
                  fill={'var(--text-white)'}
                />
                <span className="flex text-small faded center">Manage ANT</span>
              </div>
            </Link>

            <Link
              // TODO: update to route to undernames
              to={`/manage/ants/${transactionData.assetId}`}
              className="link"
              style={{ textDecoration: 'none' }}
            >
              <div
                className="flex flex-column center card"
                style={{
                  minWidth: '175px',
                  minHeight: '100px',
                  flex: 1,
                  padding: '0px',
                  gap: '.5em',
                  textDecoration: 'none',
                }}
              >
                <ArrowUpRight
                  width={'30px'}
                  height={'30px'}
                  fill={'var(--text-white)'}
                />
                <span className="flex text-small faded center">
                  Add Undernames
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default TransactionComplete;
