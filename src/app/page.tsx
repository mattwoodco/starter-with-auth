import { ModeToggle } from '@/components/common/mode-toggle';
import { ReputationTracker } from '@/components/reputation-tracker';

export default () => {
  return (
    <div className="flex h-screen w-screen flex-col p-6">
      {/* <Header /> */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-bold text-4xl">
            Business Reputation Tracker
          </h1>
          <p className="text-lg text-muted-foreground">
            Analyze your business reputation and compare with competitors using
            Google Reviews data
          </p>
        </div>
        <ReputationTracker />
      </main>
      <footer className="flex items-center justify-end">
        <ModeToggle />
      </footer>
    </div>
  );
};
