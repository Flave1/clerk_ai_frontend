import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/images/logo/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logo/logo.png" />
        
        {/* Google Fonts - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="google-site-verification" content="bpEJTud5G53ZCOdrcTa484gzYlqhxxFDTSzrTEgNn_c" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

