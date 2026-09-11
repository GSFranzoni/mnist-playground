import { getMnistNetwork } from "@mnist-playground/neural-network";
import { queryOptions } from "@tanstack/react-query";

async function loadNetwork() {
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  const response = await fetch(`${import.meta.env.BASE_URL}artifacts/weights.json`);

  if (!response.ok) {
    throw new Error("Could not load the trained weights");
  }

  const network = getMnistNetwork();

  network.load(await response.json());

  return network;
}

export const networkQueryOptions = queryOptions({
  queryKey: ["network"],
  queryFn: loadNetwork,
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
});
