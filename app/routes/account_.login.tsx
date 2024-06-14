import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request, context}: LoaderFunctionArgs) {
  return redirect(`https://store.xecurify.com/moas/broker/login/shopify/headless.fulcomm.io/account?redirect_endpoint=/account`)
}