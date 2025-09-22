// Universal PWA Service Worker Installation - Android, iOS, Windows
(function() {
  'use strict';

  // Detect platform
  const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isAndroid = /android/.test(navigator.userAgent.toLowerCase());
  const isWindows = /windows/.test(navigator.userAgent.toLowerCase());
  const isMacOS = /macintosh|mac os x/.test(navigator.userAgent.toLowerCase());
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone ||
                       document.referrer.includes('android-app://');

  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(registration => {
          console.log('✅ Service Worker registrado:', registration.scope);

          // Check for updates every 60 seconds
          setInterval(() => {
            registration.update();
          }, 60000);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Show update notification
                showUpdateNotification();
              }
            });
          });
        })
        .catch(error => {
          console.error('❌ Error al registrar Service Worker:', error);
        });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    });
  }

  // Show update notification
  function showUpdateNotification() {
    if (Notification.permission === 'granted') {
      new Notification('Sistema IT', {
        body: 'Nueva versión disponible. Actualiza para obtener las últimas mejoras.',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200]
      });
    }
  }

  // Install prompt handling for all platforms
  let deferredPrompt = null;
  let installButton = null;

  // Create install button if not in standalone mode
  if (!isStandalone) {
    createInstallUI();
  }

  function createInstallUI() {
    // Check if button already exists
    if (document.getElementById('pwa-install-container')) return;

    const container = document.createElement('div');
    container.id = 'pwa-install-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      display: none;
      animation: slideIn 0.3s ease-out;
    `;

    const button = document.createElement('button');
    button.id = 'pwa-install-button';
    button.style.cssText = `
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      transition: all 0.3s ease;
    `;

    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Instalar App</span>
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
    });

    container.appendChild(button);
    document.body.appendChild(container);
    installButton = button;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(120%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Handle install prompt for Android/Chrome/Edge
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (installButton) {
      installButton.parentElement.style.display = 'block';

      installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
          installButton.parentElement.style.display = 'none';
          deferredPrompt.prompt();

          const { outcome } = await deferredPrompt.userChoice;
          console.log(`Install prompt: ${outcome}`);
          deferredPrompt = null;
        }
      });
    }
  });

  // iOS specific install instructions
  if (isIOS && !isStandalone) {
    // Show iOS install instructions after a delay
    setTimeout(() => {
      showIOSInstallInstructions();
    }, 3000);
  }

  function showIOSInstallInstructions() {
    // Check if already shown
    if (localStorage.getItem('ios-install-shown')) return;

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.3s ease-out;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 20px; padding: 30px; max-width: 320px; text-align: center;">
        <h3 style="margin: 0 0 20px; color: #333; font-size: 20px;">Instalar Sistema IT</h3>
        <p style="color: #666; margin: 0 0 20px; line-height: 1.5;">
          Para instalar esta app en tu iPhone/iPad:
        </p>
        <ol style="text-align: left; color: #666; margin: 0 0 20px; padding-left: 20px;">
          <li>Toca el botón compartir <span style="color: #007AFF;">⬆️</span></li>
          <li>Selecciona "Añadir a pantalla de inicio"</li>
          <li>Toca "Añadir"</li>
        </ol>
        <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('ios-install-shown', 'true');"
                style="background: #007AFF; color: white; border: none; padding: 12px 30px; border-radius: 10px; font-size: 16px; cursor: pointer;">
          Entendido
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Windows/Desktop specific features
  if (isWindows || isMacOS) {
    // Add keyboard shortcut hint
    document.addEventListener('DOMContentLoaded', () => {
      console.log('💡 Tip: Presiona Ctrl+Shift+A (Windows) o Cmd+Shift+A (Mac) para instalar la app');
    });
  }

  // Handle app installed event
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada exitosamente');

    if (installButton) {
      installButton.parentElement.style.display = 'none';
    }

    // Track installation
    localStorage.setItem('pwa-installed', 'true');
    localStorage.setItem('pwa-install-date', new Date().toISOString());
  });

  // Check if running as PWA
  if (isStandalone) {
    document.body.classList.add('pwa-standalone');
    console.log('🚀 Ejecutando en modo PWA standalone');

    // Enable full-screen features
    if (document.documentElement.requestFullscreen) {
      document.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          // Optionally request fullscreen on first interaction
          // document.documentElement.requestFullscreen();
        }
      }, { once: true });
    }
  }

  // Handle online/offline status
  function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    document.body.classList.toggle('offline', !isOnline);

    if (isOnline) {
      console.log('✅ Conexión restaurada');
      localStorage.setItem('lastOnlineTime', new Date().toISOString());
    } else {
      console.log('⚠️ Sin conexión');
    }
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    setTimeout(() => {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }, 5000);
  }

  // Performance optimization - lazy load images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    });
  }

  // App visibility handling
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('App en background');
    } else {
      console.log('App activa');
      // Check for updates when app becomes visible
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
      }
    }
  });

  // Export for external use
  window.PWAInstaller = {
    isInstalled: () => isStandalone || localStorage.getItem('pwa-installed') === 'true',
    getPlatform: () => {
      if (isIOS) return 'iOS';
      if (isAndroid) return 'Android';
      if (isWindows) return 'Windows';
      if (isMacOS) return 'macOS';
      return 'Unknown';
    },
    prompt: () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else if (isIOS) {
        showIOSInstallInstructions();
      }
    }
  };

})();