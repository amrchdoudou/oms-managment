// src/services/pixelService.ts

export const loadPixels = (pixels: any[]) => {
  // Inject to head
  pixels.forEach((p) => {
    if (p.platform === 'meta') {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${p.pixel_id}');
      `;
      document.head.appendChild(script);
    } else if (p.platform === 'tiktok') {
      const script = document.createElement('script');
      script.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${p.pixel_id}');
        }(window, document, 'ttq');
      `;
      document.head.appendChild(script);
    }
  });
};

export const firePageView = () => {
  if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'PageView');
  if (typeof (window as any).ttq === 'object') (window as any).ttq.page();
};

export const fireViewContent = (product: any) => {
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'ViewContent', {
      content_name: product.name,
      value: product.price,
      currency: 'DZD'
    });
  }
  if (typeof (window as any).ttq === 'object') {
    (window as any).ttq.track('ViewContent', {
      contents: [{
        content_name: product.name,
        price: product.price
      }],
      value: product.price,
      currency: 'DZD'
    });
  }
};

export const fireInitiateCheckout = (product: any) => {
  if (typeof (window as any).fbq === 'function') (window as any).fbq('track', 'InitiateCheckout', { value: product.price, currency: 'DZD' });
  if (typeof (window as any).ttq === 'object') (window as any).ttq.track('InitiateCheckout', { value: product.price, currency: 'DZD' });
};

export const firePurchase = (order: any, total: number) => {
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', 'Purchase', { currency: 'DZD', value: total });
  }
  if (typeof (window as any).ttq === 'object') {
    (window as any).ttq.track('CompletePayment', { value: total, currency: 'DZD' });
  }
};
