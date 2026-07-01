import { ScrollView } from 'react-native';
import { ScreenShell, PlaceholderBox } from '../../shared/components/ScreenShell';
import { PaymentHistoryScreen } from './PaymentHistoryScreen';

export function MyRentScreen() {
  return (
    <ScreenShell title="My Rent">
      <ScrollView>
        {/*
          UI TODO:
          - Show current invoice.
          - Show rent amount.
          - Show extra charges.
          - Show total amount.
          - Show due date.
          - Show status.
          - Show payment link button.
          - Show note: payment confirmation will be updated by admin.
        */}
        <PlaceholderBox text="My Rent UI will be designed later." />
        <PaymentHistoryScreen embedded />
      </ScrollView>
    </ScreenShell>
  );
}
