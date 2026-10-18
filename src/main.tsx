import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { wagmiConfig } from './lib/wagmi';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          options={{ reducedMotion: true }}
          customTheme={{
            '--ck-connectbutton-background': '#e6e6e6',
            '--ck-connectbutton-color': '#040506',
            '--ck-connectbutton-hover-background': '#ffffff',
            '--ck-connectbutton-active-background': '#d6d6d6',
            '--ck-connectbutton-border-radius': '9999px',
            '--ck-connectbutton-font-size': '13px',
            '--ck-connectbutton-font-weight': '500',
            '--ck-connectbutton-height': '36px',
            '--ck-connectbutton-box-shadow': 'none',
          } as any}
        >
          <App />
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
