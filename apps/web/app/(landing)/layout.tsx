import type { Metadata } from 'next';
import { Header } from '../../components/landing/Header';
import { Footer } from '../../components/landing/Footer';

export const metadata: Metadata = {
  title: 'My Dev Deck — Your personal dev tool deck',
  description:
    'An open-source, self-hostable collection of developer tools. Built in public, shaped by the community. Try the demo or explore on GitHub.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
