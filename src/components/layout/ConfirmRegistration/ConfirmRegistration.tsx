import { useState } from 'react';

import { useGlobalState } from '../../../state/contexts/GlobalState';
import { useRegistrationState } from '../../../state/contexts/RegistrationState';
import { NAME_PRICE_INFO } from '../../../utils/constants';
import { AlertCircle } from '../../icons';
import './styles.css';

function ConfirmRegistration() {
  const [{ walletAddress }] = useGlobalState();
  const [
    {
      domain,
      chosenTier,
      ticker,
      nickname,
      controllers,
      ttl,
      leaseDuration,
      targetID,
      antID,
      fee,
      stage,
    },
    dispatchRegistrationState,
  ] = useRegistrationState();
  const [priceInfo, setPriceInfo] = useState(false);

  return (
    <>
      <div className="registerNameModal center">
        <span className="sectionHeader">Confirm Domain Registration</span>
        <div className="card hover" style={{ gap: '1em', padding: '2em' }}>
          <span className="bubble">{`Tier ${
            chosenTier ? chosenTier : 'not set'
          }`}</span>
          <span className="detail">
            Domain:&nbsp;<b>{domain}</b>
          </span>
          <span className="detail">
            Target ID:&nbsp;<b>{targetID ? targetID : 'not set'}</b>
          </span>
          <span className="detail">
            ANT Contract ID:&nbsp;<b>{antID ? antID : 'not set'}</b>
          </span>
          <span className="detail">
            Nickname*:&nbsp;<b>{nickname ? nickname : 'not set'}</b>
          </span>
          <span className="detail">
            Ticker*:&nbsp;<b>{ticker ? ticker : 'not set'}</b>
          </span>
          <span className="detail">
            Controllers*:&nbsp;
            <b>{controllers.length ? controllers : 'not set'}</b>
          </span>
          <span className="detail">
            Owner:&nbsp;<b>{walletAddress ? walletAddress : 'not set'}</b>
          </span>
          <span className="detail">
            ttlSeconds:&nbsp;<b>{ttl ? ttl : 'not set'}</b>
          </span>
          <span className="detail">
            Subdomains:&nbsp;<b>Up to 100</b>
          </span>
          <span className="detail">
            Lease Duration:&nbsp;
            <b>{leaseDuration ? leaseDuration : 'not set'}</b>
          </span>
        </div>
        <span className="text faded underline">
          You will sign two (2) transactions, a registration fee (paid in ARIO
          tokens) and the Arweave network fee (paid in AR).
        </span>
        <button
          className="sectionHeader toolTip"
          onClick={() => {
            setPriceInfo(!priceInfo);
          }}
        >
          {fee.io?.toLocaleString()}&nbsp;ARIO&nbsp;
          <AlertCircle
            width={'16px'}
            height={'16px'}
            fill={'var(--text-white)'}
          />
          {priceInfo ? (
            <span className="infoBubble">
              <span className="text bold black center">{NAME_PRICE_INFO}</span>
              {/**TODO: link to faq or about page */}
              <a
                href="https://ar.io/"
                target="_blank"
                rel="noreferrer"
                className="text faded underline bold center"
              >
                Need help choosing a tier?
              </a>
            </span>
          ) : (
            <></>
          )}
        </button>
        <button
          className="accentButton"
          onClick={() =>
            dispatchRegistrationState({
              type: 'setStage',
              payload: stage + 1,
            })
          }
        >
          Confirm
        </button>
      </div>
    </>
  );
}

export default ConfirmRegistration;
