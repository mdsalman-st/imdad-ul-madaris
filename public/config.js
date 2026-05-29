(function () {
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  if (!window.IMDAD_API_BASE) {
    window.IMDAD_API_BASE = isLocal ? 'http://localhost:5000' : 'https://imdad-backend-1.onrender.com';
  }
  if (!window.IMDAD_AUTH_API_BASE) {
    window.IMDAD_AUTH_API_BASE = isLocal ? 'http://localhost:5000/api' : 'https://imdad-backend-1.onrender.com/api';
  }
  // #region agent log
  window.__imdadDebugLog = function (location, message, data, hypothesisId) {
    fetch('http://127.0.0.1:7666/ingest/f7fffd33-d020-453e-873d-5687b908c60f', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'fbaa6e' }, body: JSON.stringify({ sessionId: 'fbaa6e', location: location, message: message, data: data || {}, hypothesisId: hypothesisId || '', timestamp: Date.now(), runId: window.__imdadRunId || 'pre-fix' }) }).catch(function () {});
  };
  window.__imdadDebugLog('config.js:init', 'API bases configured', { host: host, isLocal: isLocal, apiBase: window.IMDAD_API_BASE, authApiBase: window.IMDAD_AUTH_API_BASE, page: location.pathname }, 'A');
  window.addEventListener('error', function (ev) {
    window.__imdadDebugLog('window:onerror', 'Uncaught JS error', { message: ev.message, file: ev.filename, line: ev.lineno }, 'D');
  });
  window.addEventListener('unhandledrejection', function (ev) {
    window.__imdadDebugLog('window:unhandledrejection', 'Unhandled promise rejection', { reason: String(ev.reason) }, 'D');
  });
  // #endregion
})();

window.getImdadUserId = function (user) {
  if (!user) return null;
  return user.userId || user._id || user.id || null;
};
