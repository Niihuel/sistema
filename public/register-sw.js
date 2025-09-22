// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registrado con éxito:', registration);

        // Verificar actualizaciones cada 5 minutos
        setInterval(() => {
          registration.update();
        }, 300000);
      })
      .catch((error) => {
        console.log('Error al registrar Service Worker:', error);
      });
  });
}