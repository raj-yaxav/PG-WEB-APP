import { ScrollView } from 'react-native';
import { ScreenShell, PlaceholderBox } from '../../shared/components/ScreenShell';

export function ComplaintStatusScreen() {
  return (
    <ScreenShell title="Complaints">
      <ScrollView>
        {/*
          UI TODO:
          - List complaints.
          - Status badges: pending, in progress, resolved.
          - Complaint title.
          - Category.
          - Date.
          - Admin note if available.
          - Detail view later.
        */}
        <PlaceholderBox text="Complaint Status UI will be designed later." />
      </ScrollView>
    </ScreenShell>
  );
}
