(function () {
  var host = window.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  if (!window.IMDAD_API_BASE) {
    window.IMDAD_API_BASE = isLocal ? 'http://localhost:5000' : 'https://imdad-backend-1.onrender.com';
  }
  if (!window.IMDAD_AUTH_API_BASE) {
    window.IMDAD_AUTH_API_BASE = isLocal ? 'http://localhost:5000/api' : 'https://imdad-backend-1.onrender.com/api';
  }

})();

window.getImdadUserId = function (user) {
  if (!user) return null;
  return user.userId || user._id || user.id || null;
};
