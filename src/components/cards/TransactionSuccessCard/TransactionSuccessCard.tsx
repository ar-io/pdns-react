import { useEffect, useRef } from 'react';

import { ArweaveTransactionID } from '../../../services/arweave/ArweaveTransactionID';
import { CircleCheckFilled, CloseIcon } from '../../icons';
import ArweaveID, { ArweaveIdTypes } from '../../layout/ArweaveID/ArweaveID';

function TransactionSuccessCard({
  txId,
  title,
  close,
}: {
  txId: ArweaveTransactionID;
  close?: () => void;
  title?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [txId, cardRef]);

  return (
    <div
      ref={cardRef}
      className="flex flex-row success-container center fade-in"
    >
      <CircleCheckFilled
        width={'20px'}
        height={'20px'}
        fill={'var(--success-green)'}
      />
      <div
        className="flex-column"
        style={{
          width: '100%',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
          gap: '5px',
          fontSize: '16px',
        }}
      >
        <span className="white">{title ?? 'Transaction Complete'}</span>
        <ArweaveID
          id={txId}
          type={ArweaveIdTypes.INTERACTION}
          shouldLink={true}
          linkStyle={{ color: 'var(--success-green)' }}
        />
      </div>
      {close ? (
        <button className="button flex center cursor-pointer" onClick={close}>
          <CloseIcon width={'20px'} height={'20px'} fill="white" />
        </button>
      ) : (
        <></>
      )}
    </div>
  );
}

export default TransactionSuccessCard;
