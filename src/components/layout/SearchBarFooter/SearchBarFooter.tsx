import { SearchBarFooterProps } from '../../../types';
import { encodeDomainToASCII, isDomainReservedLength } from '../../../utils';
import PDNTCard from '../../cards/PDNTCard/PDNTCard';
import AuctionChart from '../AuctionChart/AuctionChart';
import EmailNotificationCard from '../EmailNotificationCard/EmailNotificationCard';
import './styles.css';

function SearchBarFooter({
  searchTerm,
  searchResult,
  isAvailable,
  reservedList,
  isAuction,
}: SearchBarFooterProps): JSX.Element {
  if (isAuction && searchTerm) {
    return (
      <div className="flex flex-row">
        <AuctionChart domain={searchTerm} showAuctionExplainer={true} />
      </div>
    );
  }

  if (
    (searchTerm && reservedList.includes(encodeDomainToASCII(searchTerm))) ||
    (searchTerm && isDomainReservedLength(searchTerm))
  ) {
    return (
      <div className="flex flex-row" style={{ marginTop: '30px' }}>
        <EmailNotificationCard />
      </div>
    );
  }
  return (
    <div className="flex flex-column" style={{ marginTop: 30 }}>
      {!isAvailable && searchResult && searchTerm ? (
        <>
          <span className="flex flex-row white text-medium flex-left">
            Ownership Details:
          </span>
          <PDNTCard
            domain={searchTerm}
            contractTxId={searchResult}
            compact={true}
            enableActions={true}
          />
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
export default SearchBarFooter;
