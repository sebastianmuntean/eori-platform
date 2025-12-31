'use client';

export default function Home() {
  console.log('Step 1: Rendering Home page');
  
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p className="text-gray-500">Home page</p>
      </div>
    </main>
  );
}
