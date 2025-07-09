// src/app/(auth)/layout.tsx

import React from 'react';

// This layout will wrap all pages within the (auth) route group,
// such as /login and /register-user.
// It simply renders its children, allowing the individual pages to provide their full content.
// You could add shared UI elements here later, like a header specific to auth pages.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>{children}</>
  );
}
