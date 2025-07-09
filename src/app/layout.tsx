// src/app/layout.tsx

import './globals.css';
// Removed direct Inter font import from 'next/font/google' as shadcn/ui setups often handle fonts differently,
// typically via global CSS or a dedicated font utility.
// If you are using @next/font, you would import it here and apply it to the body.
// For now, assuming fonts are handled via globals.css or other project configuration.

import { AuthContextProvider } from '../context/AuthContext';
import { Toaster } from 'sonner'; // Import Toaster from sonner

// If you're using @next/font/google with shadcn/ui, you might have something like this:
// import { Inter as FontSans } from "next/font/google"
// export const fontSans = FontSans({
//   subsets: ["latin"],
//   variable: "--font-sans",
// })
// And then apply it to the body: className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}
// For simplicity here, we'll assume global CSS handles font-family.

export const metadata = {
  title: 'Salon Booking App',
  description: 'Book your next salon visit with ease!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Removed Tailwind CSS CDN. Shadcn/ui projects configure Tailwind via postcss and a build step. */}
        {/* Removed direct Google Fonts link and inline style. Fonts are typically handled via @next/font or global CSS. */}
      </head>
      {/* Assuming 'Inter' or a similar font is applied via globals.css or a font utility class */}
      <body>
        {/* Wrap your entire application with AuthContextProvider */}
        <AuthContextProvider>
          {children}
        </AuthContextProvider>
        {/* Add the Sonner Toaster component here */}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}