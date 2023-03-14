import { Link } from 'react-router-dom';

import { useGlobalState } from '../../../state/contexts/GlobalState';
import { ANTContractJSON, ArweaveTransactionID } from '../../../types';
import { STUB_ARWEAVE_TXID } from '../../../utils/constants';
import { AntCard } from '../../cards';
import { ArrowUpRight } from '../../icons';

export enum transaction_types {
  TRANSFER_ANT = 'Transfer ANT Token',
  EDIT_ANT = 'Edit ANT Token',
  CREATE_UNDERNAME = 'Create Under_Name',
  CREATE_ANT = 'Create ANT Token',
  TRANSFER_IO = 'Transfer IO Token',
  BUY_ARNS_NAME = 'Buy ArNS Name',
}

function TransactionSuccess({
  transactionId = new ArweaveTransactionID(STUB_ARWEAVE_TXID),
  state,
}: {
  transactionId?: ArweaveTransactionID;
  state: ANTContractJSON;
}) {
  const [{}, dispatchGlobalState] = useGlobalState(); // eslint-disable-line

  return (
    <>
      <div className="flex-column center" style={{ gap: '3em' }}>
        <div className="flex-column center" style={{ gap: '2em' }}>
          <AntCard
            domain={''}
            id={transactionId}
            state={state}
            compact={true}
            enableActions={false}
            overrides={{
              tier: 1,
              ttlSeconds: state.records['@'].ttlSeconds,
              maxSubdomains: state.records['@'].maxSubdomains,
              leaseDuration: `N/A`,
            }}
          />
          <div
            className="flex flex-row center"
            style={{ gap: '1em', maxWidth: '782px' }}
          >
            <Link
              to="/"
              className="link"
              style={{ textDecoration: 'none' }}
              onClick={() =>
                dispatchGlobalState({
                  type: 'setShowCreateAnt',
                  payload: false,
                })
              }
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

            <Link
              rel="noreferrer"
              target={'_blank'}
              to={`https://sonar.warp.cc/#/app/contract/${transactionId.toString()}`}
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

            <Link
              to="/manage"
              className="link"
              style={{ textDecoration: 'none' }}
              onClick={() =>
                dispatchGlobalState({
                  type: 'setShowCreateAnt',
                  payload: false,
                })
              }
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
              to="/manage"
              className="link"
              style={{ textDecoration: 'none' }}
              onClick={() =>
                dispatchGlobalState({
                  type: 'setShowCreateAnt',
                  payload: false,
                })
              }
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

export default TransactionSuccess;
