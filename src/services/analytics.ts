class AnalyticsService {
  private static isInitialized = false;
  
  static initializeGoogleAnalytics(trackingId: string) {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Load Google tag script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script1);

    // Add gtag configuration
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${trackingId}');
    `;
    document.head.appendChild(script2);

    this.isInitialized = true;
  }

  static trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }
  }

  static trackPageView(pageTitle: string, pagePath: string) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'AW-17319034937', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath
      });
    }
  }
}

export default AnalyticsService;