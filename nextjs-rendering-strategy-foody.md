# Strategi CSR / SSR / SSG / ISR di Next.js (App Router) untuk Desain Aplikasi Food Ordering

Dokumen ini menjelaskan **secara detail dan lengkap** pemilihan strategi rendering (**CSR, SSR, SSG, ISR**) berdasarkan desain yang kamu kirim (Home, Login/Register, Detail, Category, Cart, Checkout, Success, Orders, Review, Profile) serta contoh kode **Next.js App Router**.

> Target: Next.js 13/14/15 (App Router).  
> Catatan: Contoh di bawah memakai **React Server Components (default)** + **Client Components** untuk interaksi UI.

---

## 1) Konsep Dasar: CSR vs SSR vs SSG vs ISR

### A. CSR (Client Side Rendering)
**Render terjadi di browser** setelah JavaScript selesai di-load. Umumnya data di-fetch memakai `useEffect`, React Query, SWR, atau state management (Zustand/Redux).

**Kapan cocok?**
- Halaman **banyak interaksi** (tambah/kurang item cart, modal review, form).
- Data sangat **user-specific** dan sering berubah di sisi user (state lokal).
- SEO tidak penting.

**Kelebihan**
- Interaksi terasa natural (stateful).
- Cocok untuk pengalaman “app-like”.

**Kekurangan**
- First load bisa lebih lambat (butuh JS).
- SEO kurang ideal untuk konten publik.
- Data baru muncul setelah hydration.

---

### B. SSR (Server Side Rendering)
**Render terjadi di server setiap request**. User langsung dapat HTML yang sudah berisi data terbaru.

**Kapan cocok?**
- Data **sensitif** / khusus user (Orders, Profile, Checkout).
- Harus selalu **fresh** (status pembayaran, daftar pesanan).
- Perlu validasi session/token di server.

**Kelebihan**
- Data selalu terbaru (real-time per request).
- Lebih aman untuk data privat (bisa cek session sebelum render).
- SEO bagus (untuk halaman publik, walau SSR biasanya lebih “mahal”).

**Kekurangan**
- Beban server lebih besar (render tiap request).
- Performa bisa lebih lambat dibanding caching statis jika traffic tinggi.

---

### C. SSG (Static Site Generation)
Halaman dibangun **saat build** menjadi HTML statis.

**Kapan cocok?**
- Konten publik yang **jarang berubah**.
- Landing page, halaman info, dsb.

**Kelebihan**
- Super cepat (CDN cache).
- Biaya server rendah.

**Kekurangan**
- Perubahan data butuh rebuild & redeploy (tanpa ISR).

---

### D. ISR (Incremental Static Regeneration)
ISR = SSG yang bisa **refresh otomatis** setelah interval tertentu.  
Next.js akan menyajikan versi cache, lalu **meregenerasi** halaman di background setelah melewati waktu `revalidate`.

**Kapan cocok?**
- Halaman publik dengan data yang **berubah berkala** (restaurant list, menu, rekomendasi).
- Butuh performa tinggi + update data tanpa rebuild.

**Kelebihan**
- Cepat seperti SSG (cached).
- Data tetap “cukup fresh” tanpa rebuild manual.

**Kekurangan**
- Data tidak selalu realtime (tergantung interval revalidate).
- Perlu strategi invalidasi yang tepat.

---

## 2) Pemetaan Halaman Berdasarkan Desain

Berikut rekomendasi strategi rendering yang paling cocok:

| Halaman (sesuai desain) | Render Type | Kenapa? (Inti) |
|---|---|---|
| **Home** (Explore, Recommended) | **ISR / SSG** | Publik, SEO penting, performa tinggi, data bisa update berkala |
| **Category / All Restaurant** | **ISR** | Publik, list sering berubah, cocok caching dengan revalidate |
| **Detail Restaurant / Menu** | **ISR** | Publik, SEO penting, menu & review bisa update periodik |
| **Login** | **CSR** | Form interaktif, tidak butuh SEO |
| **Register** | **CSR** | Form interaktif, tidak butuh SEO |
| **My Cart** | **CSR** | State-heavy (qty, remove, subtotal) & user-specific |
| **Checkout** | **Hybrid SSR + CSR** | SSR untuk validasi session/cart, CSR untuk interaksi pembayaran |
| **Payment Success** | **SSR** | Status transaksi harus valid & fresh, sensitif |
| **My Orders** | **SSR** | Data privat user, harus fresh |
| **Review (modal/page)** | **CSR** | Form, rating, submit, optimistik UI |
| **Profile** | **SSR** | Data privat, aman render di server |

---

## 3) Struktur Folder (App Router) yang Disarankan

Contoh struktur sederhana:

```
app/
  page.tsx                      # Home (ISR)
  category/
    page.tsx                    # Category list (ISR)
  restaurant/
    [slug]/
      page.tsx                  # Detail (ISR)
      review/
        page.tsx                # Review page (CSR) opsional
  auth/
    login/
      page.tsx                  # Login (CSR)
    register/
      page.tsx                  # Register (CSR)
  cart/
    page.tsx                    # Cart (CSR)
  checkout/
    page.tsx                    # Checkout (SSR + CSR)
  orders/
    page.tsx                    # Orders (SSR)
  profile/
    page.tsx                    # Profile (SSR)
  success/
    page.tsx                    # Payment success (SSR)
lib/
  api.ts                        # fungsi fetch data
  auth.ts                       # helper session
components/
  home/
  cart/
  checkout/
```

---

## 4) Contoh Implementasi Kode per Strategi

> Semua contoh di bawah menggunakan App Router.  
> Default `page.tsx` adalah **Server Component** (SSR/SSG/ISR) kecuali kamu pakai `'use client'`.

---

# A) Home — ISR / SSG

**Kenapa Home ISR?**
- Halaman publik → SEO & performa penting
- Data rekomendasi berubah (tapi tidak per detik)
- ISR membuat halaman cepat (cached) namun tetap update

### `app/page.tsx` (ISR)
```tsx
// app/page.tsx
export const revalidate = 60; // re-generate setiap 60 detik (ISR)

import { getRestaurants } from "@/lib/api";

export default async function HomePage() {
  const restaurants = await getRestaurants();

  return (
    <main>
      <h1>Explore Culinary Experiences</h1>
      <section>
        {restaurants.map((r) => (
          <a key={r.id} href={`/restaurant/${r.slug}`}>
            {r.name}
          </a>
        ))}
      </section>
    </main>
  );
}
```

### `lib/api.ts`
```ts
// lib/api.ts
export type Restaurant = {
  id: string;
  name: string;
  slug: string;
};

export async function getRestaurants(): Promise<Restaurant[]> {
  const res = await fetch("https://example.com/api/restaurants", {
    // App Router caching:
    // - Untuk ISR, Next akan meng-cache response sesuai revalidate dari page
    // - atau kamu bisa set manual:
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error("Failed to fetch restaurants");
  return res.json();
}
```

> Jika kamu ingin **SSG murni**, set `export const revalidate = false;` (atau hapus) dan pastikan fetch di-cache default (perubahan akan membutuhkan rebuild).

---

# B) Category / List Restaurant — ISR

**Kenapa ISR?**
- Filter list restoran/kategori sering berubah (resto baru/closed)
- Tetap publik, jadi caching penting untuk perf

### `app/category/page.tsx`
```tsx
export const revalidate = 120;

import { getRestaurants } from "@/lib/api";

export default async function CategoryPage() {
  const restaurants = await getRestaurants();

  return (
    <main>
      <h1>All Restaurant</h1>
      {restaurants.map((r) => (
        <div key={r.id}>
          <a href={`/restaurant/${r.slug}`}>{r.name}</a>
        </div>
      ))}
    </main>
  );
}
```

---

# C) Detail Restaurant / Menu — ISR

**Kenapa ISR?**
- Public page + SEO
- Menu bisa berubah tapi tidak wajib realtime per request
- Banyak traffic → caching mengurangi beban server

### `app/restaurant/[slug]/page.tsx`
```tsx
export const revalidate = 300;

import { getRestaurantBySlug } from "@/lib/api";

export default async function RestaurantDetail({ params }: { params: { slug: string } }) {
  const restaurant = await getRestaurantBySlug(params.slug);

  return (
    <main>
      <h1>{restaurant.name}</h1>

      <h2>Menu</h2>
      <ul>
        {restaurant.menu.map((m) => (
          <li key={m.id}>
            {m.name} - {m.price}
            <a href="/cart">Add to cart</a>
          </li>
        ))}
      </ul>

      <h2>Reviews</h2>
      <ul>
        {restaurant.reviews.map((rv) => (
          <li key={rv.id}>{rv.comment}</li>
        ))}
      </ul>
    </main>
  );
}
```

### `lib/api.ts` (tambahan)
```ts
export type MenuItem = { id: string; name: string; price: number };
export type Review = { id: string; comment: string; rating: number };

export type RestaurantDetail = {
  id: string;
  name: string;
  slug: string;
  menu: MenuItem[];
  reviews: Review[];
};

export async function getRestaurantBySlug(slug: string): Promise<RestaurantDetail> {
  const res = await fetch(`https://example.com/api/restaurants/${slug}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error("Failed to fetch restaurant detail");
  return res.json();
}
```

---

# D) Login / Register — CSR

**Kenapa CSR?**
- Form interaktif (validation, loading, errors)
- Tidak butuh SEO

### `app/auth/login/page.tsx`
```tsx
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      alert("Login failed");
      return;
    }

    window.location.href = "/";
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={onSubmit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        <button type="submit">Login</button>
      </form>
    </main>
  );
}
```

> Register sama konsepnya (CSR).

---

# E) My Cart — CSR

**Kenapa CSR?**
- Keranjang = interaksi intens, state lokal, update cepat
- UX lebih baik jika tidak reload

### `app/cart/page.tsx`
```tsx
"use client";

import { useMemo, useState } from "react";

type CartItem = { id: string; name: string; price: number; qty: number };

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([
    { id: "1", name: "Burger", price: 25000, qty: 1 },
    { id: "2", name: "Fries", price: 15000, qty: 2 },
  ]);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  function inc(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)));
  }

  function dec(id: string) {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
    );
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  return (
    <main>
      <h1>My Cart</h1>

      {items.map((it) => (
        <div key={it.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1 }}>{it.name}</div>
          <button onClick={() => dec(it.id)}>-</button>
          <span>{it.qty}</span>
          <button onClick={() => inc(it.id)}>+</button>
          <div>{it.price * it.qty}</div>
          <button onClick={() => remove(it.id)}>Remove</button>
        </div>
      ))}

      <hr />
      <div>Subtotal: {subtotal}</div>

      <a href="/checkout">Checkout</a>
    </main>
  );
}
```

> Di produksi biasanya state disimpan di **Zustand** atau di server + cookies/session.

---

# F) Checkout — Hybrid SSR + CSR

**Kenapa Hybrid?**
- SSR: validasi user login + ambil data cart dari server/cookie (aman)
- CSR: pilih metode pembayaran, submit order, loading states

### `app/checkout/page.tsx` (SSR)
```tsx
import { getUserFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic"; // pastikan SSR (tidak di-cache)

export default async function CheckoutPage() {
  const user = await getUserFromSession(); // cek session di server

  if (!user) {
    // redirect jika tidak login (gunakan next/navigation jika perlu)
    return (
      <main>
        <p>You must login first.</p>
        <a href="/auth/login">Go to login</a>
      </main>
    );
  }

  return <CheckoutClient user={user} />;
}
```

### `app/checkout/CheckoutClient.tsx` (CSR)
```tsx
"use client";

import { useState } from "react";

export default function CheckoutClient({ user }: { user: { id: string; name: string } }) {
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);

  async function placeOrder() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      window.location.href = `/success?orderId=${data.orderId}`;
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Checkout</h1>
      <p>User: {user.name}</p>

      <label>
        Payment Method:
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="COD">Cash</option>
          <option value="CARD">Card</option>
          <option value="EWALLET">E-Wallet</option>
        </select>
      </label>

      <button onClick={placeOrder} disabled={loading}>
        {loading ? "Processing..." : "Place Order"}
      </button>
    </main>
  );
}
```

---

# G) Payment Success — SSR

**Kenapa SSR?**
- Status pembayaran harus valid (hindari user spoof)
- Data order sensitif
- Selalu fresh per request

### `app/success/page.tsx`
```tsx
export const dynamic = "force-dynamic";

import { getOrderById } from "@/lib/api";

export default async function SuccessPage({ searchParams }: { searchParams: { orderId?: string } }) {
  const orderId = searchParams.orderId;
  if (!orderId) return <main>Missing orderId</main>;

  const order = await getOrderById(orderId);

  return (
    <main>
      <h1>Payment Success</h1>
      <p>Order ID: {order.id}</p>
      <p>Status: {order.status}</p>
      <a href="/orders">Go to My Orders</a>
    </main>
  );
}
```

---

# H) My Orders — SSR

**Kenapa SSR?**
- Data privat & user-specific
- Harus up-to-date (order berjalan, shipped, completed)

### `app/orders/page.tsx`
```tsx
export const dynamic = "force-dynamic";

import { getUserFromSession } from "@/lib/auth";
import { getOrdersByUser } from "@/lib/api";

export default async function OrdersPage() {
  const user = await getUserFromSession();
  if (!user) return <main>Please login</main>;

  const orders = await getOrdersByUser(user.id);

  return (
    <main>
      <h1>My Orders</h1>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            {o.id} - {o.status}
          </li>
        ))}
      </ul>
    </main>
  );
}
```

---

# I) Review (Modal / Page) — CSR

**Kenapa CSR?**
- Form & rating interaktif
- Bisa optimistik UI (langsung tampil sebelum server confirm)

### `app/restaurant/[slug]/review/page.tsx`
```tsx
"use client";

import { useState } from "react";

export default function ReviewPage({ params }: { params: { slug: string } }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  async function submit() {
    const res = await fetch(`/api/restaurants/${params.slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });

    if (!res.ok) alert("Failed submit review");
    else alert("Review submitted!");
  }

  return (
    <main>
      <h1>Give Review</h1>

      <label>
        Rating:
        <input type="number" value={rating} min={1} max={5} onChange={(e) => setRating(Number(e.target.value))} />
      </label>

      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write comment..." />

      <button onClick={submit}>Submit</button>
    </main>
  );
}
```

---

# J) Profile — SSR

**Kenapa SSR?**
- Data privat
- Aman ambil data di server sesuai session

### `app/profile/page.tsx`
```tsx
export const dynamic = "force-dynamic";

import { getUserFromSession } from "@/lib/auth";
import { getUserProfile } from "@/lib/api";

export default async function ProfilePage() {
  const user = await getUserFromSession();
  if (!user) return <main>Please login</main>;

  const profile = await getUserProfile(user.id);

  return (
    <main>
      <h1>Profile</h1>
      <div>Name: {profile.name}</div>
      <div>Email: {profile.email}</div>
    </main>
  );
}
```

---

## 5) Tips Praktis Penting (Agar Tidak Salah Cache)

### A) Pastikan halaman user-private tidak di-cache
Gunakan salah satu:
- `export const dynamic = "force-dynamic";` pada page
- atau fetch: `{ cache: "no-store" }`

### Contoh:
```ts
await fetch("https://example.com/api/orders", { cache: "no-store" });
```

---

## 6) Kapan Memilih Apa? (Aturan Cepat)

- **Public + SEO + traffic tinggi** → ISR  
- **Public + jarang berubah** → SSG  
- **Private / butuh fresh tiap request** → SSR  
- **Form + state-heavy** → CSR  
- **Checkout / flow transaksi** → SSR untuk guard + CSR untuk interaksi

---

## 7) Checklist Implementasi untuk Project Kamu

- [ ] Home pakai `revalidate` (ISR)
- [ ] Category pakai `revalidate` (ISR)
- [ ] Detail restoran pakai `revalidate` (ISR)
- [ ] Cart & Review pakai `'use client'` (CSR)
- [ ] Orders, Profile, Success pakai `dynamic = "force-dynamic"` (SSR)
- [ ] Checkout hybrid: SSR guard + CSR submit

---

## Penutup

Dengan mapping ini:
- halaman publik cepat + SEO bagus (ISR/SSG)
- halaman user aman & selalu up-to-date (SSR)
- UX interaktif di cart/checkout/review (CSR)

Kalau kamu mau, aku bisa bantu lanjut:
- contoh **Zustand Cart Store**
- contoh **Route Handler** (`app/api/.../route.ts`) untuk login/order/review
- contoh **middleware** untuk proteksi route

