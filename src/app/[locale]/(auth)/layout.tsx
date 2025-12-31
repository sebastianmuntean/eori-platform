import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  console.log('Step 1: Rendering Auth layout');
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="text-2xl font-semibold text-text-primary">ERP Platform</span>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

