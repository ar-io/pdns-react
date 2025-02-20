import { AoGetCostDetailsParams, mARIOToken } from '@ar.io/sdk';
import { useCostDetails } from '@src/hooks/useCostDetails';
import { useGlobalState, useWalletState } from '@src/state';
import { formatARIOWithCommas, formatDateMDY } from '@src/utils';
import Lottie from 'lottie-react';
import { useEffect, useRef, useState } from 'react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CategoricalChartState } from 'recharts/types/chart/types';
import { Coordinate } from 'recharts/types/util/types';

import arioLoading from '../../icons/ario-spinner.json';

const START_RNP_PREMIUM = 50;

export function RNPChart({
  name,
  purchaseDetails,
}: {
  name: string;
  purchaseDetails?: Partial<AoGetCostDetailsParams>;
}) {
  const [{ walletAddress }] = useWalletState();
  const { data: costDetails } = useCostDetails({
    intent: 'Buy-Name',
    years: 1,
    type: 'lease',
    fromAddress: walletAddress?.toString(),
    name,
    ...(purchaseDetails ?? {}),
  });

  type ChartData = {
    timestamp: number;
    price: number;
  }[];

  const [chartData, setChartData] = useState<ChartData>([]);
  const [activePayload, setActivePayload] = useState<any>(null);
  const [defaultTooltip, setDefaultTooltip] = useState<any>(null);
  const [defaultTooltipCoords, setDefaultTooltipCoords] =
    useState<Partial<Coordinate> | null>(null);
  const [defaultTooltipIndex, setDefaultTooltipIndex] = useState<any>(0);
  const [tooltipData, setTooltipData] = useState<any>(null);

  const chartRef = useRef<{ state: CategoricalChartState }>(null);
  const [refReady, setRefReady] = useState(false);

  // NOTE: there is *SOMETHING* wrong with chartRef in that it only *sometimes* triggers the below effect that positions the tooltip.
  // moving that effect up in the order helps some, but not perfectly. This was the only way to ensure reliable (if slow) triggering of that effect to set the position.

  // TODO: get rid of this nasty garbage and find a better solution.
  useEffect(() => {
    if (chartRef.current) {
      setRefReady(!!chartRef.current); // Mark the ref as ready
    }
  }, [chartRef.current]);

  useEffect(() => {
    try {
      if (costDetails?.returnedNameDetails) {
        const startPrice =
          costDetails.returnedNameDetails.basePrice * START_RNP_PREMIUM;
        const endPrice = costDetails.returnedNameDetails.basePrice;
        const currentPrice = costDetails.tokenCost;

        const startTimestamp = costDetails.returnedNameDetails.startTimestamp;
        const endTimestamp = costDetails.returnedNameDetails.endTimestamp;
        const totalPoints = 500;

        // Ensure the current timestamp is within bounds
        const currentTimestamp = Math.min(
          Math.max(Date.now(), startTimestamp),
          endTimestamp,
        );

        // Determine the split ratio based on where `currentTimestamp` falls
        const percentagePassed =
          (currentTimestamp - startTimestamp) / (endTimestamp - startTimestamp);
        const beforeCount = Math.round(totalPoints * percentagePassed);
        const afterCount = totalPoints - beforeCount;

        const beforePoints = new Array(beforeCount).fill(true).map((_, i) => {
          const timestamp =
            startTimestamp +
            ((currentTimestamp - startTimestamp) / (beforeCount - 1 || 1)) * i;

          const percent =
            (timestamp - startTimestamp) /
            (currentTimestamp - startTimestamp || 1);
          const price = startPrice + percent * (currentPrice - startPrice);

          return { price: Math.round(price), timestamp };
        });

        const afterPoints = new Array(afterCount).fill(true).map((_, i) => {
          const timestamp =
            currentTimestamp +
            ((endTimestamp - currentTimestamp) / (afterCount - 1 || 1)) * i;

          const percent =
            (timestamp - currentTimestamp) /
            (endTimestamp - currentTimestamp || 1);
          const price = currentPrice + percent * (endPrice - currentPrice);

          return { price: Math.round(price), timestamp };
        });

        // Combine the segments and ensure correct ordering
        setChartData(
          [...beforePoints, ...afterPoints].sort(
            (a, b) => a.timestamp - b.timestamp,
          ),
        );
        return;
      }
    } catch (error) {
      console.error(error);
    }
    setChartData([]);
  }, [costDetails]);

  useEffect(() => {
    const point = chartData?.find((d) => d.price === costDetails?.tokenCost);
    if (point) {
      const tipData = {
        payload: [
          {
            value: point.price,
            timestamp: point.timestamp,
          },
        ],
        label: point.timestamp,
      };
      setDefaultTooltip(tipData);
      setTooltipData(tipData);

      // Calculate the index of the default tooltip point
      const index = chartData.findIndex((d) => d.timestamp === point.timestamp);
      setDefaultTooltipIndex(index);

      if (
        chartRef.current?.state?.xAxisMap &&
        chartRef.current?.state?.yAxisMap
      ) {
        const { xAxisMap, yAxisMap } = chartRef.current.state;
        const xScale = xAxisMap[0].scale as any;
        const yScale = yAxisMap[0].scale as any;
        setDefaultTooltipCoords({
          x: xScale(point.timestamp),
          y: yScale(point.price),
        });
      }
    }
  }, [refReady, chartData]);

  const CustomTooltip = ({ data }: { data: any }) => {
    const [{ arioTicker }] = useGlobalState();

    if (data?.payload?.length) {
      return (
        <div className="flex flex-col bg-dark-grey rounded p-2 text-white items-center justify-center">
          <p>{formatDateMDY(data.label)}</p>
          <p>
            {formatARIOWithCommas(
              new mARIOToken(data.payload[0].value).toARIO().valueOf(),
            )}{' '}
            {arioTicker}
          </p>
        </div>
      );
    }

    return null;
  };

  const renderActiveDot = (props: any) => {
    const { cx, cy, payload } = props;

    const isActive = tooltipData?.payload?.[0]?.value === payload.price;

    if (isActive) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="white"
          stroke="black"
          strokeWidth={1}
        />
      );
    }

    return <></>;
  };

  if (!chartData?.length)
    return (
      <span className="h-fit flex flex-col text-white w-full items-center p-5 justify-center m-auto">
        <Lottie animationData={arioLoading} loop={true} className="h-[100px]" />
        <span>Loading Price Chart...</span>
      </span>
    );

  if (!costDetails?.returnedNameDetails) return <></>;

  return (
    <div className="flex flex-col size-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          ref={chartRef as any}
          margin={{
            top: 0,
            left: -60,
            right: 0,
            bottom: -30,
          }}
          onMouseMove={(state) => {
            if (state?.activePayload?.length) {
              const currentPayload = state.activePayload[0];
              setActivePayload(currentPayload);
              setTooltipData({
                payload: [currentPayload],
                label: currentPayload.payload.timestamp,
              });
            } else {
              setActivePayload(null);
              setTooltipData(defaultTooltip);
            }
          }}
          onMouseLeave={() => {
            setActivePayload(null);
            setTooltipData(defaultTooltip);
          }}
        >
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={false}
            padding={{ left: 10, right: 10 }}
            allowDataOverflow={false}
            allowDuplicatedCategory={false}
          />
          <YAxis
            dataKey="price"
            tick={false}
            domain={['dataMin', 'dataMax']}
            type="number"
            padding={{ bottom: 10, top: 10 }}
            allowDataOverflow={false}
            allowDuplicatedCategory={false}
          />
          <Tooltip
            content={<CustomTooltip data={tooltipData} />}
            wrapperStyle={{ visibility: 'visible' }}
            cursor={false}
            defaultIndex={activePayload ? undefined : defaultTooltipIndex}
            active={activePayload ? undefined : true}
            position={
              activePayload !== null || !defaultTooltipCoords
                ? undefined
                : defaultTooltipCoords
            }
          />

          <Line
            animationDuration={200}
            type="linear"
            dataKey="price"
            data={chartData.filter(
              (point) => point.price >= costDetails.tokenCost,
            )}
            stroke="white"
            strokeWidth={2}
            dot={(props) => renderActiveDot(props)}
          />
          <Line
            animationDuration={200}
            type="linear"
            dataKey="price"
            data={chartData.filter(
              (point) => point.price <= costDetails.tokenCost,
            )}
            stroke="white"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={(props) => renderActiveDot(props)}
          />
        </LineChart>
      </ResponsiveContainer>{' '}
      <div className="flex justify-between pt-2 text-[14px] text-white">
        <span>
          {formatDateMDY(costDetails.returnedNameDetails.startTimestamp)}
        </span>
        <span>
          {' '}
          {formatDateMDY(costDetails.returnedNameDetails.endTimestamp)}
        </span>
      </div>
    </div>
  );
}
