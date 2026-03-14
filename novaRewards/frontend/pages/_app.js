import { WalletProvider } from '../context/WalletContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <WalletProvider>
      <Component {...pageProps} />
    </WalletProvider>
  );
}
