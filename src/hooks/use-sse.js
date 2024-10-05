import { useState, useEffect, useRef } from "react";

/**
 * Hook to fetch data using Server-Sent Events (SSE)
 * Mainly used for real-time updates from the server
 *
 * @param {String} url - The SSE URL
 * @param {() => any} fallbackFn - Fallback function to call if SSE fails
 * @returns {{ data: any, error: string | null, isSSEActive: boolean, stopSSE: () => void }} - Returns SSE data, error, SSE status, and stop function
 */
export const useSSE = (url, fallbackFn) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isSSEActive, setIsSSEActive] = useState(true);
  const eventSourceRef = useRef(null); // Use ref to store the EventSource instance

  useEffect(() => {
    if (!url) return;

    const eventSource = new EventSource(url, {
      withCredentials: true,
    });
    eventSourceRef.current = eventSource; // Store the EventSource instance in ref

    // Handle SSE message
    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      setData(parsedData);
    };

    // Handle SSE error
    eventSource.onerror = (err) => {
      setError("Error receiving updates");
      setIsSSEActive(false); // SSE connection has failed
      eventSource.close();
      console.log("SSE failed, falling back to manual fetch.", err);

      // Fallback to manually fetching if SSE fails
      if (typeof fallbackFn === "function") {
        fallbackFn()
          .then((response) => {
            setData(response); // Update the state with the fetched data
          })
          .catch((err) => setError(err));
      }
    };

    // Cleanup the EventSource on component unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [url, fallbackFn]);

  const stopSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setIsSSEActive(false);
      console.log("SSE connection closed manually");
    }
  };

  return { data, error, isSSEActive, stopSSE };
};
