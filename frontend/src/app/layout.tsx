import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import Navigation from '@/components/Navigation';
import DonationPopup from '@/components/DonationPopup';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pet Koi',
  description: 'Track and manage your pet\'s identity, health, and location',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navigation />
          <DonationPopup />
          {children}
        </Providers>
      </body>
    </html>
  );
}
