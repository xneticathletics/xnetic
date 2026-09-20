// React Native WebView'in beklediği köprü: window.ReactNativeWebView
// sadece uygulama içinde (bir WebView'de yüklendiğinde) mevcut olur —
// normal bir tarayıcıda açılırsa bu fonksiyonlar sessizce hiçbir şey
// yapmaz, sayfa çökmez.
//
// NOT: Bu kod eskiden captcha-challenge.html içinde satır içi (inline)
// <script> olarak duruyordu. vercel.json'daki Content-Security-Policy
// satır içi script'e izin vermediği için ('unsafe-inline' YOK) harici
// dosyaya taşındı — aksi halde Turnstile callback'leri tanımsız kalır ve
// MOBİL GİRİŞİN TAMAMI kırılır. Buraya geri inline kod koymayın.
function postToApp(payload) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
}
function onTurnstileSuccess(token) {
  document.getElementById("status").textContent = "Doğrulandı ✓";
  postToApp({ type: "success", token: token });
}
function onTurnstileExpired() {
  document.getElementById("status").textContent = "Süresi doldu, tekrar deneniyor…";
  postToApp({ type: "expired" });
}
function onTurnstileError() {
  document.getElementById("status").textContent = "Doğrulama başarısız.";
  postToApp({ type: "error" });
}
