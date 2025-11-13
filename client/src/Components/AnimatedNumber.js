import React, { useEffect, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const isNumeric = (value) => typeof value === 'number' && Number.isFinite(value);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const DEFAULT_FORMATTER = (value) => {
  const rounded = Math.round(value);
  return rounded.toLocaleString();
};

function AnimatedNumber({
  value,
  formatter = DEFAULT_FORMATTER,
  duration = 1400,
  overshoot = 0.1,
  className,
}) {
  const [displayValue, setDisplayValue] = useState(() => (isNumeric(value) ? 0 : value));
  const startRef = useRef(0);
  const rafRef = useRef(null);
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (!isNumeric(value)) {
      setDisplayValue(value);
      startRef.current = value;
      return undefined;
    }

    const targetValue = value;
    let startValue = startRef.current;

    if (firstRunRef.current) {
      startValue = 0;
      firstRunRef.current = false;
    }

    if (!isNumeric(startValue)) {
      startValue = 0;
    }

    const signedDifference = targetValue - startValue;

    if (Math.abs(signedDifference) < 0.0001) {
      setDisplayValue(targetValue);
      startRef.current = targetValue;
      return undefined;
    }

    const overshootDistance = Math.abs(signedDifference) * overshoot;
    const overshootValue = targetValue + Math.sign(signedDifference || 1) * overshootDistance;
    const firstPhaseDuration = duration * 0.65;
    const secondPhaseDuration = duration - firstPhaseDuration;
    const animationStart = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - animationStart;

      if (elapsed <= firstPhaseDuration) {
        const phaseProgress = clamp(elapsed / firstPhaseDuration, 0, 1);
        const eased = easeOutCubic(phaseProgress);
        const current = startValue + (overshootValue - startValue) * eased;
        setDisplayValue(current);
      } else if (elapsed < duration) {
        const phaseProgress = clamp((elapsed - firstPhaseDuration) / secondPhaseDuration, 0, 1);
        const eased = easeInOutCubic(phaseProgress);
        const current = overshootValue + (targetValue - overshootValue) * eased;
        setDisplayValue(current);
      } else {
        setDisplayValue(targetValue);
        startRef.current = targetValue;
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration, overshoot]);

  const displayContent = isNumeric(displayValue) ? formatter(displayValue) : formatter(value);

  return <span className={className}>{displayContent}</span>;
}

export default AnimatedNumber;
