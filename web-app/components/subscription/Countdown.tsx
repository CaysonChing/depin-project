"use client";

import { useEffect, useState } from "react";

export function Countdown({
  endTime,
  subscriptionId,
}: {
  endTime: string;
  subscriptionId?: string;
}) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    let hasUpdated = false;

    async function markInactive() {
      if (!subscriptionId) return;

      try {
        await fetch("/api/subscription/expire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        });
        console.log(`Subscription ${subscriptionId} marked inactive`);
      } catch (err) {
        console.error("Failed to mark subscription inactive:", err);
      }
    }

    function updateTime() {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        
        if(!hasUpdated){
          markInactive();
          hasUpdated = true;
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [endTime, subscriptionId]);

  return <span>{timeLeft}</span>;
}
