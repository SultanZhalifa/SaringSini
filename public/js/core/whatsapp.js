export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;

export const shareOnWhatsApp = (text) => window.open(whatsappUrl(text), '_blank', 'noopener');
