import { useRef } from 'react';

import { JsonWalletConnector } from '../../../services/wallets/JsonWalletConnector';
import { useGlobalState } from '../../../state/contexts/GlobalState';
import { ArweaveWalletConnector } from '../../../types';
import {
  ArConnectIcon,
  ArweaveAppIcon,
  CloseIcon,
  UploadIcon,
} from '../../icons';
import './styles.css';

function ConnectWalletModal({ show }: { show: boolean }): JSX.Element {
  const modalRef = useRef(null);
  const [{}, dispatch] = useGlobalState(); // eslint-disable-line

  function handleClickOutside(e: any) {
    if (modalRef.current && modalRef.current === e.target) {
      closeModal();
    }
    return;
  }

  function closeModal() {
    dispatch({
      type: 'setConnectWallet',
      payload: false,
    });
  }

  async function setGlobalWallet(walletConnector: ArweaveWalletConnector) {
    try {
      const wallet = await walletConnector.connect();
      // TODO: set wallet in local storage/securely cache
      dispatch({
        type: 'setJwk',
        payload: wallet,
      });
    } catch (error: any) {
      console.error(error);
    }
  }

  return show ? (
    // eslint-disable-next-line
    <div className="modalContainer" ref={modalRef} onClick={handleClickOutside}>
      <div className="connectWalletModal">
        <p
          className="sectionHeader"
          style={{ marginBottom: '1em', fontFamily: 'Rubik-Bold' }}
        >
          Connect with an Arweave wallet
        </p>
        <button className="modalCloseButton" onClick={closeModal}>
          <CloseIcon width="30px" height={'30px'} fill="var(--text-white)" />
        </button>
        <button className="walletConnectButton">
          <UploadIcon
            width={'47px'}
            height={'47px'}
            fill={'var(--text-white)'}
          />
          Import your JSON keyfile
          <label className="span-all">
            <input
              className="hidden"
              type="file"
              onChange={(e) =>
                e.target?.files?.length &&
                setGlobalWallet(new JsonWalletConnector(e.target.files[0]))
              }
            />
          </label>
        </button>
        <button className="walletConnectButton">
          <img src={ArConnectIcon} alt="" width="47px" height="47px" />
          Connect via ArConnect
        </button>
        <button className="walletConnectButton">
          <img src={ArweaveAppIcon} alt="" width="47px" height="47px" />
          Connect using Arweave.app
        </button>
        <span className="bold text white" style={{ marginTop: '1em' }}>
          Don&apos;t have a wallet?&nbsp;
          <a
            target="_blank"
            href="https://ardrive.io/start"
            style={{ color: 'inherit' }}
            rel="noreferrer"
          >
            &nbsp;Get one here
          </a>
        </span>
      </div>
    </div>
  ) : (
    <></>
  );
}
export default ConnectWalletModal;
