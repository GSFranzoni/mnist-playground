import { useQuery } from "@tanstack/react-query";

import { NetworkLoadingScreen } from "@/components/network-loading-screen";
import { Playground } from "@/playground";
import { networkQueryOptions } from "@/queries/network.query";

export function App() {
  const network = useQuery(networkQueryOptions);

  if (network.isPending) {
    return <NetworkLoadingScreen />;
  }

  if (network.isError) {
    return (
      <main className="bg-canvas text-chalk grid min-h-dvh place-items-center px-5 text-center">
        <p className="font-display text-xl">
          the tiny brain could not wake up — reload to try again ✎
        </p>
      </main>
    );
  }

  return <Playground network={network.data} />;
}
