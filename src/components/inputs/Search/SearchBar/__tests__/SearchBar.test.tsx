import { cleanup, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter as Router } from 'react-router-dom';

import { TRANSACTION_TYPES } from '../../../../../types';
import { lowerCaseDomain } from '../../../../../utils';
import SearchBar from '../SearchBar';

jest.mock('../../../../../hooks', () => ({
  useAuctionInfo: jest.fn(() => ({})),
  useIsFocused: jest.fn(() => false),
  useIsMobile: jest.fn(() => false),
  useWalletAddress: jest.fn(() => ({
    walletAddress: undefined,
    wallet: undefined,
  })),
  useRegistrationStatus: jest.fn(() => ({
    isAvailable: false,
    isAuction: false,
    isReserved: false,
    loading: false,
  })),
  useArweaveCompositeProvider: jest.fn(),
}));

const TEST_RECORDS = {
  ardrive: {
    contractTxId: 'I-cxQhfh0Zb9UqQNizC9PiLC41KpUeA9hjiVV02rQRw',
    startTimestamp: 1711122719,
    endTimestamp: 1711122739,
    type: TRANSACTION_TYPES.BUY,
    undernames: 10,
  },
  'xn--go8h6v': {
    contractTxId: 'I-cxQhfh0Zb9UqQNizC9PiLC41KpUeA9hjiVV02rQRw',
    startTimestamp: 1711122719,
    endTimestamp: 1711122739,
    type: TRANSACTION_TYPES.LEASE,
    undernames: 10,
  },
};

describe('SearchBar', () => {
  let searchInput: HTMLInputElement;
  let searchButton: HTMLButtonElement;
  let renderSearchBar: any;

  const onChange = jest.fn();
  const onSubmit = jest.fn();
  const onFailure = jest.fn();
  const searchBar = (
    <Router>
      <SearchBar
        value=""
        values={TEST_RECORDS}
        placeholderText={'Find a name'}
      />
      ,
    </Router>
  );

  beforeEach(() => {
    const { asFragment, getByTestId } = render(searchBar);
    renderSearchBar = asFragment;
    searchInput = getByTestId('searchbar-input-id') as HTMLInputElement;
    searchButton = getByTestId('search-button') as HTMLButtonElement;
  });

  afterEach(cleanup);

  test('renders correctly', () => {
    expect(renderSearchBar()).toMatchSnapshot();
  });

  test('handles a capitalized name correctly', async () => {
    const domain = 'ARDRIVE';

    await userEvent.type(searchInput, domain);
    await userEvent.click(searchButton);

    expect(onChange).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(lowerCaseDomain(searchInput.value)).toEqual(lowerCaseDomain(domain));
    expect(renderSearchBar()).toMatchSnapshot();
  });

  test('handles a lowercase name correctly', async () => {
    const domain = 'ardrive';

    await userEvent.type(searchInput, domain);
    await userEvent.click(searchButton);
    expect(onChange).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
    expect(lowerCaseDomain(searchInput.value)).toEqual(lowerCaseDomain(domain));
    expect(renderSearchBar()).toMatchSnapshot();
  });

  // additional tests to be added here
});
