import { Logger } from '@ar.io/sdk/web';
import '@fontsource-variable/rubik';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

import App from './App';
import './index.css';
import {
  ArNSStateProvider,
  GlobalStateProvider,
  ModalStateProvider,
  RegistrationStateProvider,
  TransactionStateProvider,
  WalletStateProvider,
  arnsReducer,
  modalReducer,
  reducer,
  registrationReducer,
  transactionReducer,
  walletReducer,
} from './state';
import { queryClient } from './utils/network';
// setup sentry
import './utils/sentry';

Logger.default.setLogLevel('none');

// Wagmi setup
const config = createConfig({
  chains: [mainnet],
  connectors: [metaMask({ extensionOnly: true, injectProvider: false })],
  transports: {
    [mainnet.id]: http(),
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider
        client={queryClient}
        // persistOptions={{
        //   persister: createIDBPersister(),
        // }}
      >
        <GlobalStateProvider reducer={reducer}>
          <WalletStateProvider reducer={walletReducer}>
            <ArNSStateProvider reducer={arnsReducer}>
              <TransactionStateProvider reducer={transactionReducer}>
                <RegistrationStateProvider reducer={registrationReducer}>
                  <ConfigProvider
                    theme={{
                      // algorithm: theme.darkAlgorithm,
                      token: {
                        colorBgBase: 'var(--primary)',
                      },
                      components: {
                        Button: {
                          colorBgBase: 'var(--primary)',
                        },
                        Progress: {
                          colorText: 'var(--text-white)',
                        },
                        Input: {
                          addonBg: 'var(--card-bg)',
                          colorBgContainer: 'var(--bg-color)',
                          activeBg: 'var(--bg-color)',
                          hoverBg: 'var(--bg-color)',
                          colorText: 'var(--text-white)',
                          colorTextPlaceholder: 'var(--text-grey)',
                          activeBorderColor: 'var(--primary)',
                          hoverBorderColor: 'var(--bg-color)',
                          colorIcon: 'var(--text-grey)',
                          colorPrimary: 'var(--primary)',
                          borderRadius: 3,
                          lineWidth: 0.5,
                          lineWidthFocus: 1,
                          lineWidthBold: 0,
                        },
                      },
                    }}
                  >
                    <ModalStateProvider reducer={modalReducer}>
                      <App />
                    </ModalStateProvider>
                  </ConfigProvider>
                </RegistrationStateProvider>
              </TransactionStateProvider>
            </ArNSStateProvider>
          </WalletStateProvider>
        </GlobalStateProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
