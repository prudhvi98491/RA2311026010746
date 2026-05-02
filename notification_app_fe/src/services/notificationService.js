const BASE_URL = "http://20.207.122.201/evaluation-service";

export const notificationTypeOptions = [
  { value: "", label: "All types" },
  { value: "Event", label: "Event" },
  { value: "Result", label: "Result" },
  { value: "Placement", label: "Placement" },
];

export async function fetchNotifications({ limit = 20, page = 1, notification_type = "", token = "" }) {
  const params = new URLSearchParams();
  params.set("limit", limit.toString());
  params.set("page", page.toString());
  if (notification_type) {
    params.set("notification_type", notification_type);
  }

  const url = `${BASE_URL}/notifications?${params.toString()}`;
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  const bodyText = await response.text();
  let data;
  try {
    data = JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`Malformed response from notifications endpoint: ${bodyText}`);
  }

  if (!response.ok) {
    const error = new Error("Failed to fetch notifications");
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data.notifications ?? [];
}

export function notificationWeight(notification) {
  const weights = {
    Placement: 100,
    Result: 70,
    Event: 40,
  };
  return weights[notification.Type] ?? 0;
}

export function groupViewedStatus(ids) {
  return ids.reduce((memo, id) => {
    memo[id] = true;
    return memo;
  }, {});
}
