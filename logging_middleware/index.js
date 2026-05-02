const LOG_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

export async function log(stack, level, packageName, message, authToken = "") {
  if (!stack || !level || !packageName || !message) {
    throw new Error("logging-middleware: missing required log fields");
  }

  const payload = {
    stack,
    level,
    package: packageName,
    message,
  };

  const headers = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(LOG_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const responseBody = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(responseBody);
  } catch (error) {
    parsed = { raw: responseBody };
  }

  if (!response.ok) {
    const error = new Error("logging-middleware: failed to send log");
    error.status = response.status;
    error.body = parsed;
    throw error;
  }

  return parsed;
}
