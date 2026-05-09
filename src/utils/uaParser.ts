export const parseDeviceType = (ua: string): string => {
  const lowercaseUA = ua.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(lowercaseUA)) {
    return 'Tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
};

export const getReferrerLabel = (referrer: string): string => {
  if (!referrer || referrer === 'direto') return 'Direto';
  
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('facebook') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'WhatsApp';
    if (host.includes('t.co') || host.includes('twitter') || host.includes('x.com')) return 'X / Twitter';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('google')) return 'Google';
    
    return host.replace('www.', '');
  } catch (e) {
    return referrer;
  }
};
