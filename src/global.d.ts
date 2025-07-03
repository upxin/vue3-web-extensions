declare const __DEV__: boolean;
/** Extension name, defined in packageJson.name */
declare const __NAME__: string;

declare module "*.vue" {
  const component: any;
  export default component;
}

type GlobalLog = (...args: Parameters<typeof console.log>) => void;
declare global {
  interface Window {
    g: GlobalLog;
  }
}
