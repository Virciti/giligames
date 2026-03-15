'use client';

/**
 * Global error boundary — catches errors in the root layout itself.
 * Must render its own <html>/<body> since the root layout may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #0c4a6e, #0c4a6e)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.2)',
              borderTopColor: '#fff',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            ⚠️
          </div>

          <h2
            style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}
          >
            Oops! Something went wrong
          </h2>
          <p
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            GiiGames ran into a problem. Don&apos;t worry — let&apos;s try again!
          </p>

          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '1rem',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
