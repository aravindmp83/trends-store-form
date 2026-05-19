import './globals.css';

export const metadata = {
  title: 'Trends Store Form',
  description: 'Form application for trends store',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
