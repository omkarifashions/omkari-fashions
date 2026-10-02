import { useCallback, useEffect, useState } from "react";

const SEEN_KEYS = {
  orders: "omkari_orders_seen_at",
  customers: "omkari_customers_seen_at",
  reviews: "omkari_reviews_seen_at",
  returns: "omkari_returns_seen_at",
  messages: "omkari_messages_seen_at",
  newsletters: "omkari_newsletters_seen_at",
};

const EMPTY_COUNTS = {
  orders: 0,
  customers: 0,
  reviews: 0,
  returns: 0,
  messages: 0,
  newsletters: 0,
};

export default function useAdminNotifications() {
  const [counts, setCounts] = useState(EMPTY_COUNTS);

  const loadCounts = useCallback(async () => {
    try {
      const { adminApi } = await import("../api/services.js");

      const [
        ordersRes,
        customersRes,
        reviewsRes,
        returnsRes,
        messagesRes,
        newslettersRes,
      ] = await Promise.all([
        adminApi.list("orders", {
          page: 1,
          limit: 100,
        }),

        adminApi.list("customers", {
          page: 1,
          limit: 100,
        }),

        adminApi.list("reviews", {
          page: 1,
          limit: 100,
        }),

        adminApi.list("returns", {
          page: 1,
          limit: 100,
        }),

        adminApi.list("messages", {
          page: 1,
          limit: 100,
        }),

        adminApi.list("newsletter", {
          page: 1,
          limit: 100,
        }),
      ]);

      const data = {
        orders: ordersRes?.orders || [],
        customers:
          customersRes?.customers ||
          customersRes?.users ||
          customersRes?.items ||
          [],
        reviews: reviewsRes?.reviews || [],
        returns: returnsRes?.returns || [],
        messages: messagesRes?.messages || [],
        newsletters:
          newslettersRes?.newsletters ||
          newslettersRes?.subscribers ||
          newslettersRes?.items ||
          [],
      };

      const newCounts = {};

      Object.entries(data).forEach(([type, items]) => {
        let seenAt = localStorage.getItem(SEEN_KEYS[type]);

        /*
         * First time admin opens the website:
         * existing records should NOT appear as new.
         */
        if (!seenAt) {
          seenAt = new Date().toISOString();
          localStorage.setItem(SEEN_KEYS[type], seenAt);
          newCounts[type] = 0;
          return;
        }

        const seenTime = new Date(seenAt).getTime();

        newCounts[type] = items.filter((item) => {
          if (!item?.createdAt) return false;

          return new Date(item.createdAt).getTime() > seenTime;
        }).length;
      });

      setCounts({
        orders: newCounts.orders || 0,
        customers: newCounts.customers || 0,
        reviews: newCounts.reviews || 0,
        returns: newCounts.returns || 0,
        messages: newCounts.messages || 0,
        newsletters: newCounts.newsletters || 0,
      });
    } catch (error) {
      console.error("Unable to load admin notifications:", error);
    }
  }, []);

  useEffect(() => {
    loadCounts();

    // Check for new records every 30 seconds.
    const interval = setInterval(loadCounts, 30000);

    return () => clearInterval(interval);
  }, [loadCounts]);

  /*
   * Mark one notification type as seen.
   */
  const markSeen = useCallback((type) => {
    const key = SEEN_KEYS[type];

    if (!key) return;

    const now = new Date().toISOString();

    localStorage.setItem(key, now);

    setCounts((current) => ({
      ...current,
      [type]: 0,
    }));
  }, []);

  const markOrdersSeen = useCallback(() => markSeen("orders"), [markSeen]);

  const markCustomersSeen = useCallback(
    () => markSeen("customers"),
    [markSeen],
  );

  const markReviewsSeen = useCallback(() => markSeen("reviews"), [markSeen]);

  const markReturnsSeen = useCallback(() => markSeen("returns"), [markSeen]);

  const markMessagesSeen = useCallback(() => markSeen("messages"), [markSeen]);

  const markNewslettersSeen = useCallback(
    () => markSeen("newsletters"),
    [markSeen],
  );

  return {
    orders: counts.orders,
    customers: counts.customers,
    reviews: counts.reviews,
    returns: counts.returns,
    messages: counts.messages,
    newsletters: counts.newsletters,

    markOrdersSeen,
    markCustomersSeen,
    markReviewsSeen,
    markReturnsSeen,
    markMessagesSeen,
    markNewslettersSeen,

    // Useful if you want to manually refresh notifications.
    refresh: loadCounts,
  };
}
