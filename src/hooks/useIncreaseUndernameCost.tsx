import { useGlobalState } from '@src/state';
import { useQuery } from '@tanstack/react-query';

export function useIncreaseUndernameCost({
  name,
  quantity,
}: {
  name: string;
  quantity: number;
}) {
  const [{ arioProcessId, arioContract }] = useGlobalState();
  return useQuery({
    queryKey: [
      'increaseUndernameCost',
      quantity,
      arioProcessId.toString(),
      name,
    ],
    queryFn: async () => {
      return await arioContract.getTokenCost({
        intent: 'Increase-Undername-Limit',
        quantity,
        name,
      });
    },
    staleTime: 1000 * 60 * 5,
  });
}
