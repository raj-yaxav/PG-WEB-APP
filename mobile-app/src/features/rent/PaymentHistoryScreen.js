import { View } from 'react-native';
import { ScreenShell, PlaceholderBox } from '../../shared/components/ScreenShell';

function PaymentHistoryContent() {
  return (
    <View style={{ marginTop: 16 }}>
      {/*
        UI TODO:
        - Show list of previous payments.
        - Amount.
        - Month/year.
        - Payment mode.
        - Payment date.
        - Status.
        - Receipt view button.
      */}
      <PlaceholderBox text="Payment History UI will be designed later." />
    </View>
  );
}

export function PaymentHistoryScreen({ embedded = false }) {
  if (embedded) {
    return <PaymentHistoryContent />;
  }

  return (
    <ScreenShell title="Payment History">
      <PaymentHistoryContent />
    </ScreenShell>
  );
}
