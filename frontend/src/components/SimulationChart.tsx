import { scaleLinear } from "d3";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SimulationSeries } from "../lib/types";

type SimulationChartProps = {
  title: string;
  values: number[];
  xValues: number[];
  color: string;
  suffix: string;
};

function linePath(xValues: number[], values: number[], width: number, height: number): string {
  const xScale = scaleLinear().domain([0, xValues.length - 1]).range([20, width - 20]);
  const maxValue = Math.max(...values, 1);
  const yScale = scaleLinear().domain([0, maxValue]).range([height - 24, 24]);
  return values
    .map((value, index) => `${index === 0 ? "M" : "L"} ${xScale(index)} ${yScale(value)}`)
    .join(" ");
}

function easeInOutCubic(value: number): number {
  if (value < 0.5) {
    return 4 * value * value * value;
  }
  return 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export function SimulationChart({ title, values, xValues, color, suffix }: SimulationChartProps) {
  const width = 360;
  const height = 180;
  const [progress, setProgress] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const animatedPathRef = useRef<SVGPathElement | null>(null);
  const maxValue = Math.max(...values, 1);
  const xScale = useMemo(() => scaleLinear().domain([0, xValues.length - 1]).range([20, width - 20]), [xValues, width]);
  const yScale = useMemo(() => scaleLinear().domain([0, maxValue]).range([height - 24, 24]), [height, maxValue]);
  const pathId = useMemo(() => title.replace(/\s+/g, "-").toLowerCase(), [title]);

  useEffect(() => {
    let frame = 0;
    let start = 0;

    const tick = (timestamp: number) => {
      if (!start) {
        start = timestamp;
      }
      const raw = Math.min((timestamp - start) / 1400, 1);
      setProgress(easeInOutCubic(raw));
      if (raw < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    setProgress(0);
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [values, xValues]);

  const path = useMemo(() => linePath(xValues, values, width, height), [xValues, values]);

  useEffect(() => {
    const pathNode = animatedPathRef.current;
    if (!pathNode) {
      return;
    }
    const totalLength = pathNode.getTotalLength();
    setPathLength(totalLength);
  }, [path, progress]);

  return (
    <section className="panel chart-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">Simulation</p>
          <h3>{title}</h3>
        </div>
        <span className="pill">Projected</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <defs>
          <linearGradient id={`gradient-${pathId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.28" />
          </linearGradient>
          <filter id={`glow-${pathId}`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="16"
            x2={width - 16}
            y1={height - ratio * (height - 40)}
            y2={height - ratio * (height - 40)}
            className="chart-grid"
          />
        ))}
        <path
          ref={animatedPathRef}
          d={path}
          fill="none"
          stroke={`url(#gradient-${pathId})`}
          strokeWidth="5"
          strokeLinecap="round"
          filter={`url(#glow-${pathId})`}
          strokeDasharray={pathLength || undefined}
          strokeDashoffset={pathLength ? pathLength * (1 - progress) : undefined}
        />
        <path d={path} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" strokeLinecap="round" />
        {values.map((value, index) => {
          const visible = progress >= index / Math.max(values.length - 1, 1);
          return (
            <g key={`${title}-${index}`} className={`chart-point ${visible ? "is-visible" : ""}`}>
              <circle cx={xScale(index)} cy={yScale(value)} r="9" fill={color} opacity="0.12" />
              <circle cx={xScale(index)} cy={yScale(value)} r="4.5" fill={color} />
            </g>
          );
        })}
      </svg>
      <div className="chart-axis">
        {xValues.map((n) => (
          <span key={`${title}-x-${n}`}>n={n}</span>
        ))}
      </div>
      <div className="chart-values">
        {values.map((value, index) => (
          <span key={`${title}-v-${index}`}>
            {value}
            {suffix}
          </span>
        ))}
      </div>
    </section>
  );
}

type SimulationDeckProps = {
  simulation: SimulationSeries;
};

export function SimulationDeck({ simulation }: SimulationDeckProps) {
  return (
    <div className="chart-grid-layout">
      <SimulationChart
        title="Runtime Growth"
        values={simulation.runtime_estimated_ms}
        xValues={simulation.n_values}
        color="#ff7a18"
        suffix="ms"
      />
      <SimulationChart
        title="Memory Growth"
        values={simulation.memory_estimated_kb}
        xValues={simulation.n_values}
        color="#0abdc6"
        suffix="kb"
      />
    </div>
  );
}
