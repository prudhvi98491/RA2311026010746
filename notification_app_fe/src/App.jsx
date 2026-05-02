import { useEffect, useMemo, useState } from "react";
import { log } from "logging-middleware";
import {
  fetchNotifications,
  notificationTypeOptions,
  notificationWeight,
} from "./services/notificationService";

const STORAGE_KEY = "affordmed_frontend_viewed_notifications";
const TABS = ["Priority Inbox", "All Notifications"];

function formatTimestamp(timestamp) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

function loadViewedIds() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveViewedIds(ids) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore storage failures
  }
}

function NotificationCard({ notification, isViewed, onMarkViewed }) {
  return (
    <article className={`notification-card ${isViewed ? "" : "new"}`}>
      <header>
        <div className="notification-type">{notification.Type}</div>
        <div className="notification-time">{formatTimestamp(notification.Timestamp)}</div>
      </header>
      <p className="notification-message">{notification.Message}</p>
      <div className="notification-actions">
        <span className="notification-chip">ID: {notification.ID}</span>
        {!isViewed && (
          <button className="button secondary" onClick={() => onMarkViewed(notification.ID)}>
            Mark viewed
          </button>
        )}
      </div>
    </article>
  );
}

function TokenPanel({ token, onTokenChange }) {
  return (
    <div className="card">
      <div className="field">
        <label htmlFor="token">Authorization token</label>
        <input
          id="token"
          className="input"
          type="text"
          placeholder="Paste Bearer token from auth endpoint"
          value={token}
          onChange={(event) => onTokenChange(event.target.value)}
        />
      </div>
      <p style={{ marginTop: 10, color: "#475569" }}>
        Use the token from the Test Server auth response to access the protected notifications and logs APIs.
      </p>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [notificationType, setNotificationType] = useState("");
  const [tab, setTab] = useState(TABS[0]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewedIds, setViewedIds] = useState(() => loadViewedIds());

  useEffect(() => {
    const stored = window.localStorage.getItem("affordmed_frontend_auth_token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("affordmed_frontend_auth_token", token);
  }, [token]);

  useEffect(() => {
    saveViewedIds(viewedIds);
  }, [viewedIds]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const fetched = await fetchNotifications({
          limit,
          page,
          notification_type: notificationType,
          token,
        });
        setNotifications(fetched);
        await log(
          "frontend",
          "info",
          "api",
          `Fetched ${fetched.length} notifications (page=${page}, limit=${limit}, type=${notificationType || "all"})`,
          token
        );
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      load();
    }
  }, [limit, page, notificationType, token]);

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !viewedIds.includes(item.ID)),
    [notifications, viewedIds]
  );

  const priorityNotifications = useMemo(() => {
    return [...unreadNotifications]
      .sort((a, b) => {
        const weight = notificationWeight(b) - notificationWeight(a);
        if (weight !== 0) return weight;
        return new Date(b.Timestamp) - new Date(a.Timestamp);
      })
      .slice(0, 10);
  }, [unreadNotifications]);

  const displayNotifications = useMemo(() => {
    if (tab === "Priority Inbox") {
      return priorityNotifications;
    }
    return notifications.slice();
  }, [notifications, priorityNotifications, tab]);

  const markViewed = async (notificationId) => {
    const next = [...new Set([...viewedIds, notificationId])];
    setViewedIds(next);
    try {
      await log(
        "frontend",
        "info",
        "middleware",
        `Marked notification ${notificationId} as viewed`,
        token
      );
    } catch {
      // ignore log failures for user actions
    }
  };

  return (
    <div className="app-shell">
      <header className="header">
        <h1 className="title">Campus Notifications</h1>
        <p className="subtitle">
          React frontend track implementation showing protected notifications, priority filtering, and frontend logging middleware.
        </p>
      </header>

      <div className="card status-block">
        <span className="status-pill">Current view: {tab}</span>
        <span className="status-pill">Unread: {unreadNotifications.length}</span>
        <span className="status-pill">Total loaded: {notifications.length}</span>
      </div>

      <TokenPanel token={token} onTokenChange={setToken} />

      <div className="tabs">
        {TABS.map((label) => (
          <button
            key={label}
            className={`tab-button ${tab === label ? "active" : ""}`}
            onClick={() => setTab(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card controls">
        <div className="control-group">
          <div className="field">
            <label htmlFor="type">Notification type filter</label>
            <select
              id="type"
              className="select"
              value={notificationType}
              onChange={(event) => setNotificationType(event.target.value)}
            >
              {notificationTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="limit">Page size</label>
            <input
              id="limit"
              className="input"
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="page">Page</label>
          <input
            id="page"
            className="input"
            type="number"
            min="1"
            value={page}
            onChange={(event) => setPage(Number(event.target.value))}
          />
          <button className="button primary" onClick={() => setViewedIds([...new Set(notifications.map((item) => item.ID))])}>
            Mark all loaded viewed
          </button>
        </div>
      </div>

      {error && <div className="error-box">Error: {error}</div>}

      <div className="card-grid">
        {loading ? (
          <div className="notification-empty">Loading notifications…</div>
        ) : displayNotifications.length === 0 ? (
          <div className="notification-empty">No notifications available for the selected filters.</div>
        ) : (
          displayNotifications.map((notification) => (
            <NotificationCard
              key={notification.ID}
              notification={notification}
              isViewed={viewedIds.includes(notification.ID)}
              onMarkViewed={markViewed}
            />
          ))
        )}
      </div>

      <footer className="footer">
        <div>
          The app uses the protected notifications endpoint and renders both priority and full notification lists.
        </div>
        <div>Built for the AffordMed frontend track.</div>
      </footer>
    </div>
  );
}
