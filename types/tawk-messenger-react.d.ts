declare module '@tawk.to/tawk-messenger-react' {
  export interface TawkMessengerReactProps {
    propertyId: string;
    widgetId: string;
  }

  export const TawkMessengerReact: React.FC<TawkMessengerReactProps>;
} 