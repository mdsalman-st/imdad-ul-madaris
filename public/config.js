(function () {
  if (!window.IMDAD_API_BASE) {
    window.IMDAD_API_BASE = 'https://imdad-backend-1.onrender.com';
  }
  if (!window.IMDAD_AUTH_API_BASE) {
    window.IMDAD_AUTH_API_BASE = 'https://imdad-backend-1.onrender.com/api';
  }

})();

window.getImdadUserId = function (user) {
  if (!user) return null;
  return user.userId || user._id || user.id || null;
};
