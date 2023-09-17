import AuthProvider from "./context/AuthProvider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <AuthProvider>
        <body style={{ margin: '0px' }}>{children}</body>
      </AuthProvider>
    </html>
  )
}
