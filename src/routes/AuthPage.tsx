import AuthForm from '../components/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-text">
            Listening Trainer
          </h1>
          <p className="mt-2 text-lg font-light text-text-secondary">
            Academic Listening Practice
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
