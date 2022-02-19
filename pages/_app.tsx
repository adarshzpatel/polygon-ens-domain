import { AppProps } from 'next/app'
import { AppPropsType } from 'next/dist/shared/lib/utils'
import '../styles/globals.css'

function MyApp({ Component, pageProps }:AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
