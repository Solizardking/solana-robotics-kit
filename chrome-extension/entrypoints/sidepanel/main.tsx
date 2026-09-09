import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, Outlet, RouterProvider, createBrowserRouter, redirect } from 'react-router-dom'
import ErrorPage from './error-page'
import { loader as accountsLoader } from './routes/Accounts'
import Home from './routes/Home'
import CreateAccount, { action as createAccountAction } from './routes/CreateAccount'
import CreateWallet from './routes/CreateWallet'
import GrokChat from './routes/GrokChat'
import WalletTokens from './routes/WalletTokens'
import WalletNFTs from './routes/WalletNFTs'
import WalletSettings from './routes/WalletSettings'
import WalletSwap from './routes/WalletSwap'
import { action as deleteAccountAction } from './routes/DeleteAccount'
import EditAccount, { action as editAccountAction, loader as editAccountLoader } from './routes/EditAccount'
import ExportAccounts from './routes/ExportAccounts'
import ExportAccountsAccounts from './routes/ExportAccountsAccounts';
import ExportAccountsAddresses from './routes/ExportAccountsAddresses';
import ImportAccounts from './routes/ImportAccounts'
import ImportAccountsAccounts, { action as importAccountsAccountsAction } from './routes/ImportAccountsAccounts'
import ImportAccountsAddresses, { action as importAccountsAddressesAction } from './routes/ImportAccountsAddresses'
import ViewAccount, { loader as viewAccountLoader } from './routes/ViewAccount'
import { loader as filteredAccountsLoader } from './routes/FilteredAccounts'
import Layout from './layout'
import Connect, { action as connectAction, loader as connectLoader } from './routes/Connect'
import TrustedSites, { loader as trustedSitesLoader } from './routes/TrustedSites'
import { createTheme, MantineProvider, rem } from '@mantine/core'
import { Notifications } from '@mantine/notifications'

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles/global.css';
import './styles/groot-theme.css';

const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <ErrorPage />,
    path: "/",
    children: [
      {
        index: true,
        element: <Navigate to='/accounts/home' replace />
      },
      {
        // chrome extension default path
        // we use this whenever we open the extension programatically
        // currently we either do this on connect, or just opening the sidepanel
        // note that when we connect we need to forward query params to /accounts/connect
        path: "sidepanel.html",
        loader: ({ request }) => {
          const { search, searchParams } = new URL(request.url);
          if (searchParams.get('connect')) {
            return redirect(`/accounts/connect${search}`)
          } else {
            return redirect('/accounts/home')
          }
        }
      },
      {
        path: "accounts",
        loader: accountsLoader,
        id: "accounts-route",
        element: <Outlet />,
        children: [
          {
            path: "home",
            element: <Home />,
          },
          {
            path: "new",
            action: createAccountAction,
            element: <CreateAccount />,
          },
          {
            path: "create-wallet",
            element: <CreateWallet />,
          },
          {
            path: "grok-chat",
            element: <GrokChat />,
          },
          {
            path: "wallet",
            element: <Outlet />,
            children: [
              {
                index: true,
                element: <Navigate to="tokens" replace />,
              },
              {
                path: "tokens",
                element: <WalletTokens />,
              },
              {
                path: "nfts",
                element: <WalletNFTs />,
              },
              {
                path: "settings",
                element: <WalletSettings />,
              },
              {
                path: "swap",
                element: <WalletSwap />,
              },
            ],
          },
          {
            path: "export",
            element: <ExportAccounts />,
            children: [
              {
                index: true,
                element: <Navigate to='addresses' replace />
              },
              {
                path: "addresses",
                element: <ExportAccountsAddresses />
              },
              {
                path: "accounts",
                element: <ExportAccountsAccounts />
              }
            ]
          },
          {
            path: "import",
            element: <ImportAccounts />,
            children: [
              {
                index: true,
                element: <Navigate to='addresses' replace />
              },
              {
                path: "addresses",
                action: importAccountsAddressesAction,
                element: <ImportAccountsAddresses />
              },
              {
                path: "accounts",
                action: importAccountsAccountsAction,
                element: <ImportAccountsAccounts />
              }
            ]
          },
          {
            path: "/accounts/:address",
            loader: viewAccountLoader,
            element: <ViewAccount />
          },
          {
            path: "/accounts/:address/edit",
            action: editAccountAction,
            loader: editAccountLoader,
            element: <EditAccount />
          },
          {
            path: "/accounts/:address/delete",
            action: deleteAccountAction
          },
          {
            path: "/accounts/connect",
            loader: connectLoader,
            action: connectAction,
            element: <Connect />
          },
        ]
      },
      {
        path: "/trusted-sites",
        loader: trustedSitesLoader,
        element: <TrustedSites />
      },
      {
        path: "/filtered-accounts",
        loader: filteredAccountsLoader,
      }
    ]
  }
]);

const mantineTheme = createTheme({
  primaryColor: 'green',
  primaryShade: 5,
  colors: {
    // Solana GR00T Cyberpunk theme colors
    green: [
      "#e6fef5",
      "#b3fdd9",
      "#80fcbd",
      "#4dfba1",
      "#1afa85",
      "#14F195", // Solana Green - Primary
      "#11d17a",
      "#0ea560",
      "#0b7946",
      "#084d2c"
    ],
    violet: [
      "#f5f0ff",
      "#e6d9ff",
      "#d4bfff",
      "#c2a5ff",
      "#b08bff",
      "#9945FF", // Solana Purple - Secondary
      "#7a37cc",
      "#5b2999",
      "#3d1b66",
      "#1e0d33"
    ],
    // blue gray preset from https://mantine.dev/colors-generator/?color=63687C
    gray: [
      "#f1f4fe",
      "#e4e6ed",
      "#c8cad3",
      "#a9adb9",
      "#9094a3",
      "#7f8496",
      "#777c91",
      "#63687c",
      "#595e72",
      "#4a5167"
    ]
  },
  spacing: {
    xxs: rem(4),
  },
  defaultRadius: 'md',
  primaryColor: 'green',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headings: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight: '700',
  },
  other: {
    solanaPurple: '#9945FF',
    solanaGreen: '#14F195',
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={mantineTheme} forceColorScheme='dark'>
      <Notifications />
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>
)
