import { useEffect, useState } from 'react';
import ConnectWalletModal from '../../modals/ConnectWalletModal/ConnectWalletModal';
import { useStateValue } from '../../../state/state';
import { NAME_PRICE_INFO, TIER_DATA } from '../../../utils/constants';
import { calculateArNSNamePrice } from '../../../utils/searchUtils';
import TierCard from '../../cards/TierCard/TierCard';
import { AlertCircle } from '../../icons';
import YearsCounter from '../../inputs/YearsCounter/YearsCounter';
import './styles.css';

function UpgradeTier({ domain }: { domain?: string }) {
  const [showModal, setShowModal] = useState(false)
  const [{ arnsSourceContract, walletAddress, jwk }] = useStateValue();
  // name is passed down from search bar to calculate price
  const [selectedTier, setSelectedTier] = useState(1);
  const [price, setPrice] = useState<number | undefined>(0);
  const [years, setYears] = useState(1);
  const [priceInfo, setPriceInfo] = useState(false);

  useEffect(() => {
    const fees = arnsSourceContract.fees;
    setPrice(calculateArNSNamePrice({ domain, selectedTier, years, fees }));
  }, [years, selectedTier, domain, arnsSourceContract]);

  return (
    <div className="upgradeTier">
      <YearsCounter setCount={setYears} count={years} />
      <div className="cardContainer">
        {Object.keys(TIER_DATA).map((tier, index: number) => (
          <TierCard
            tier={+tier}
            setTier={setSelectedTier}
            selectedTier={selectedTier}
            key={index}
          />
        ))}
      </div>
      <button
        className="sectionHeader toolTip"
        onClick={() => {
          setPriceInfo(!priceInfo);
        }}
      >
        {price?.toLocaleString()}&nbsp;ARIO&nbsp;
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
      {
       !walletAddress && !jwk ? <button className='accentButton' onClick={()=> setShowModal(true)}>Connect Wallet to proceed</button> 
        : <button className='accentButton'>Next</button>}
        {showModal ? <ConnectWalletModal setShowModal={setShowModal}/> : <></>}
    </div>
  );
}

export default UpgradeTier;
