// Hamida Furniture — ড্রাইভার পেজের সার্ভিস ওয়ার্কার
// এটা শুধু দুইটা কাজ করে: (১) ফোনে "অ্যাপের মতো ইনস্টল" চালু করার শর্ত পূরণ করে,
// (২) পেজের মূল শেলটা হালকাভাবে ক্যাশ করে রাখে যাতে নেট দুর্বল থাকলেও পেজ খুলতে সুবিধা হয়।
// ডেলিভারির আসল তথ্য (Firestore থেকে আসা) কখনো ক্যাশ হয় না — সবসময় সরাসরি সার্ভার থেকে আসে।

const CACHE = 'hf-driver-v2';
const SHELL = ['./driver.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // নিজের ডোমেইনের ফাইল ছাড়া কিছু ক্যাশ করা হয় না (Firestore/Nominatim/Leaflet ইত্যাদি সবসময় নেট থেকেই আসবে)
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        } catch (err) {}
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
