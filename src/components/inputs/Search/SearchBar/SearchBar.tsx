import { CheckCircleFilled } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  useArweaveCompositeProvider,
  useIsFocused,
  useIsMobile,
  useRegistrationStatus,
  useWalletAddress,
} from '../../../../hooks';
import { useGlobalState } from '../../../../state/contexts/GlobalState';
import { useRegistrationState } from '../../../../state/contexts/RegistrationState';
import {
  ArweaveTransactionID,
  Auction,
  SearchBarProps,
} from '../../../../types';
import {
  decodeDomainToASCII,
  encodeDomainToASCII,
  isPDNSDomainNameAvailable,
  isPDNSDomainNameValid,
  lowerCaseDomain,
  validateMaxASCIILength,
  validateMinASCIILength,
  validateNoLeadingOrTrailingDashes,
  validateNoSpecialCharacters,
} from '../../../../utils';
import {
  MAX_ARNS_NAME_LENGTH,
  PDNS_NAME_REGEX_PARTIAL,
} from '../../../../utils/constants';
import eventEmitter from '../../../../utils/events';
import { SearchIcon } from '../../../icons';
import { Loader, SearchBarFooter, SearchBarHeader } from '../../../layout';
import ValidationInput from '../../text/ValidationInput/ValidationInput';
import './styles.css';

const searchBarSuccessPredicate = ({
  value,
  records,
}: {
  value: string | undefined;
  records: { [x: string]: any };
}) => {
  if (!value) {
    return false;
  }

  return isPDNSDomainNameAvailable({
    name: encodeDomainToASCII(value),
    records: records,
  });
};

const searchBarValidationPredicate = ({
  value,
}: {
  value: string | undefined;
}) => {
  if (!value) {
    return false;
  }

  return isPDNSDomainNameValid({
    name: encodeDomainToASCII(value),
  });
};

function SearchBar(props: SearchBarProps) {
  const { disabled = false, placeholderText, values, value } = props;
  const navigate = useNavigate();
  const [{ blockHeight }, dispatchGlobalState] = useGlobalState();
  const arweaveDataProvider = useArweaveCompositeProvider();
  const [, dispatchRegisterState] = useRegistrationState();
  const { walletAddress } = useWalletAddress();
  const isMobile = useIsMobile();
  const [isSearchValid, setIsSearchValid] = useState(true);
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [searchBarText, setSearchBarText] = useState<string>(
    decodeDomainToASCII(value),
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLDivElement | null>(null);
  const [searchBarBorder, setSearchBarBorder] = useState({});
  const isSearchbarFocused = useIsFocused('searchbar-input-id');
  const {
    isAvailable,
    isAuction,
    isReserved,
    loading: isValidatingRegistration,
    validated,
  } = useRegistrationStatus(lowerCaseDomain(value));
  const [auctionInfo, setAuctionInfo] = useState<Auction>();

  function reset() {
    setSearchSubmitted(false);
    setIsSearchValid(true);
    setSearchBarText('');
    return;
  }
  useEffect(() => {
    if (!searchBarText) {
      reset();
    }
    if (searchParams.get('search') !== searchBarText) {
      // clear search params on new search
      const serializeSearchParams: Record<string, string> = {};
      setSearchParams(serializeSearchParams);
    }
  }, [searchBarText]);

  useEffect(() => {
    if (value) {
      setSearchBarText(decodeDomainToASCII(value));
      _onSubmit();
      return;
    }
  }, [value]);

  useEffect(() => {
    if (
      (value && !isValidatingRegistration && searchSubmitted && validated) ||
      !searchBarText
    ) {
      const style = handleSearchbarBorderStyle({
        domain: value,
        auction: isAuction,
        available: isAvailable,
        reserved: isReserved,
        submitted: searchSubmitted,
        focused: isSearchbarFocused && !validated,
      });
      setSearchBarBorder(style);
    }

    if (isAuction) {
      updateAuctionInfo(value);
    }
  }, [
    searchBarText,
    searchSubmitted,
    isSearchbarFocused,
    isAuction,
    isAvailable,
    isReserved,
    validated,
  ]);

  async function updateAuctionInfo(domain: string) {
    try {
      if (!blockHeight) {
        const block = await arweaveDataProvider.getCurrentBlockHeight();
        dispatchGlobalState({
          type: 'setBlockHeight',
          payload: block,
        });
        return;
      }
      const info = await arweaveDataProvider.getAuctionPrices({
        domain: lowerCaseDomain(domain),
      });
      if (!info) {
        return;
      }
      setAuctionInfo(info);
    } catch (error) {
      setSearchBarText('');
      eventEmitter.emit('error', error);
    }
  }

  function _onChange(e: string) {
    setSearchSubmitted(false);
    const input = e.trim();
    const searchValid = searchBarValidationPredicate({
      value: encodeDomainToASCII(input),
    });
    setIsSearchValid(searchValid);
    setSearchBarText(input);
    dispatchRegisterState({
      type: 'reset',
    });
  }

  function _onFocus() {
    // center search bar on the page
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  function _onSubmit(next = false) {
    dispatchRegisterState({
      type: 'setIsSearching',
      payload: true,
    });
    if (next) {
      navigate(`/register/${decodeDomainToASCII(searchBarText)}`);
    }
    // TODO: validation may also be async, so return a promise that resolves to a boolean

    const searchValid = searchBarValidationPredicate({
      value: lowerCaseDomain(searchBarText ?? ''),
    });
    setIsSearchValid(searchValid);
    if (!searchValid) {
      return;
    }

    // show updated states based on search result
    // TODO: [PE-4604] update to check if available using arweaveDateProvider.getRecord()
    const searchSuccess = searchBarSuccessPredicate({
      value: lowerCaseDomain(searchBarText ?? ''),
      records: values ?? {},
    });
    setSearchSubmitted(true);
    // setIsAvailable(searchSuccess);
    if (searchSuccess && searchBarText && values) {
      // on additional functions passed in
      dispatchRegisterState({
        type: 'setDomainName',
        payload: searchBarText,
      });
      dispatchRegisterState({
        type: 'setANTID',
        payload: undefined,
      });
      if (auctionInfo?.type) {
        dispatchRegisterState({
          type: 'setRegistrationType',
          payload: auctionInfo.type,
        });
      }
    } else if (!searchSuccess && searchBarText && values) {
      dispatchRegisterState({
        type: 'setDomainName',
        payload: encodeDomainToASCII(searchBarText),
      });
      dispatchRegisterState({
        type: 'setANTID',
        payload: values[lowerCaseDomain(searchBarText)].contractTxId
          ? new ArweaveTransactionID(
              values[lowerCaseDomain(searchBarText)].contractTxId,
            )
          : undefined,
      });
    }
  }

  function _onSubmitButton() {
    if (!walletAddress?.toString()) {
      navigate('/connect', {
        state: `/?search=${searchBarText}`,
      });
    }

    _onSubmit(true);
  }

  function handleSearchbarBorderStyle({
    domain,
    auction,
    available,
    reserved,
    submitted,
    focused,
  }: {
    domain: string;
    auction: boolean;
    available: boolean;
    reserved: boolean;
    submitted: boolean;
    focused: boolean;
  }) {
    const noTextBorderStyle = {
      border: 'solid 1px var(--text-faded)',
      marginBottom: '30px',
    };
    const whiteBorderStyle = {
      border: 'var(--text-white) solid 2px',
      marginBottom: '30px',
    };
    const greyBorderStyle = {
      border: '2px solid var(--text-grey)',
      marginBottom: '30px',
    };
    const greenBorderStyle = {
      border: '2px solid var(--success-green)',
      marginBottom: '0px',
    };
    const redBorderStyle = {
      border: '2px solid var(--error-red)',
      marginBottom: '30px',
    };
    const accentBorderStyle = {
      border: '2px solid var(--accent)',
      marginBottom: '30px',
    };

    // Named variables for the cases
    const isTextSubmitted = domain && submitted;
    const isTextNotSubmitted = domain && !submitted;
    const isSearchbarEmptyFocused = !domain && focused;
    const isTextPresentNotSubmitted = domain && !submitted;

    switch (true) {
      case isTextSubmitted: {
        if (reserved) {
          return greyBorderStyle;
        }
        if (auction) {
          return accentBorderStyle;
        }

        return available ? greenBorderStyle : redBorderStyle;
      }

      case isTextNotSubmitted:
      case isSearchbarEmptyFocused:
      case isTextPresentNotSubmitted:
        return whiteBorderStyle;

      default:
        return noTextBorderStyle;
    }
  }

  return (
    <div
      className="searchbar-container flex-center"
      style={{ maxWidth: '787px' }}
    >
      <SearchBarHeader
        defaultText="Find a name"
        domain={searchSubmitted ? searchBarText : undefined}
        isAvailable={isAvailable}
        isAuction={isAuction}
        isReserved={isReserved}
        contractTxId={
          values && values[lowerCaseDomain(value)]?.contractTxId
            ? new ArweaveTransactionID(
                values[lowerCaseDomain(value)]?.contractTxId,
              )
            : undefined
        }
      />

      <div
        className="searchbar"
        style={{
          marginBottom: '30px',
          width: '100%',
          position: 'relative',
          ...searchBarBorder,
        }}
        ref={inputRef}
      >
        <ValidationInput
          inputClassName="searchbar-input"
          inputId="searchbar-input-id"
          customPattern={PDNS_NAME_REGEX_PARTIAL}
          // <input> tag considers emojis as 2 characters in length, so we need to encode the string to ASCII to get the correct length manually
          maxCharLength={(v) =>
            !(lowerCaseDomain(v).length > MAX_ARNS_NAME_LENGTH)
          }
          inputType="search"
          onPressEnter={() => _onSubmit()}
          disabled={disabled}
          placeholder={placeholderText}
          value={searchBarText}
          setValue={(v) => _onChange(v)}
          onClick={() => _onFocus()}
          inputCustomStyle={{ height: '65px' }}
          wrapperCustomStyle={{
            height: '65px',
            width: '100%',
          }}
          showValidationChecklist={!isMobile}
          showValidationErrors={false}
          showValidationsDefault={!isMobile}
          validationListStyle={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: '15px',
            gap: 15,
            color: searchBarText ? 'var(--text-white)' : 'var(--text-grey)',
          }}
          validationPredicates={{
            'Min. 1 character': {
              fn: (query) => validateMinASCIILength(query, 1),
            },
            [`Max. ${MAX_ARNS_NAME_LENGTH} characters`]: {
              fn: (query) =>
                validateMaxASCIILength(query, MAX_ARNS_NAME_LENGTH),
            },
            'No special characters': {
              fn: (query) => validateNoSpecialCharacters(query),
            },
            'Dashes cannot be leading or trailing': {
              fn: (query) => validateNoLeadingOrTrailingDashes(query),
            },
          }}
          customValidationIcons={{
            error: (
              <CheckCircleFilled
                style={{ fontSize: 16, color: 'var(--text-grey)' }}
              />
            ),
            success: (
              <CheckCircleFilled
                style={{ fontSize: 16, color: 'var(--success-green)' }}
              />
            ),
          }}
        />
        {searchBarText && searchSubmitted ? (
          isValidatingRegistration ? (
            <Loader size={30} color="var(--text-grey)" />
          ) : (
            <button
              className="link bold text flex-center"
              style={{
                color: 'var(--text-grey)',
                width: 'fit-content',
                position: 'absolute',
                right: isMobile ? '10px' : '75px',
                height: '100%',
              }}
              onClick={() => reset()}
            >
              Clear
            </button>
          )
        ) : (
          <></>
        )}
        {isMobile ? (
          <></>
        ) : (
          <button
            data-testid="search-button"
            className="button pointer"
            style={{
              width: `${65}px`,
              height: `${65}px`,
              borderLeft: '1px solid #38393B',
            }}
            onClick={() => {
              isSearchValid && _onSubmit();
            }}
          >
            <SearchIcon fill="white" width={18} height={18} />
          </button>
        )}
      </div>
      {searchSubmitted && isAvailable && !isReserved ? (
        <div
          className={`flex flex-row fade-in ${
            isAuction ? 'flex-space-between' : 'flex-center'
          }`}
          style={{
            alignItems: 'center',
            marginTop: isMobile ? '20px' : '50px',
            boxSizing: 'border-box',
            flexDirection: isMobile ? 'column-reverse' : 'row',
          }}
        >
          {isAuction && auctionInfo?.minimumAuctionBid ? (
            <div
              className="flex flex-column"
              style={{
                gap: '8px',
                justifyContent: 'center',
                width: 'fit-content',
              }}
            >
              <span
                className="white left"
                style={{ fontSize: '16px', width: 'fit-content' }}
              >
                Current auction price for instant buy:{' '}
                {(auctionInfo?.minimumAuctionBid
                  ? Math.round(auctionInfo?.minimumAuctionBid)
                  : 0
                ).toLocaleString('en-US')}{' '}
                IO
              </span>
              <span
                className="grey left"
                style={{ fontSize: '13px', width: 'fit-content' }}
              >
                Started by: {auctionInfo?.initiator}
              </span>
            </div>
          ) : (
            <></>
          )}
          <button
            className="accent-button center"
            onClick={_onSubmitButton}
            style={{
              padding: '0px',
              height: '50px',
              width: '130px',
              fontSize: '14px',
            }}
          >
            Register Now
          </button>
        </div>
      ) : (
        <></>
      )}

      <SearchBarFooter
        isAuction={isAuction}
        isAvailable={isAvailable}
        isReserved={isReserved}
        domain={value}
        contractTxId={
          values && values[lowerCaseDomain(value)]?.contractTxId
            ? new ArweaveTransactionID(
                values[lowerCaseDomain(value)]?.contractTxId,
              )
            : undefined
        }
      />
    </div>
  );
}

export default SearchBar;
