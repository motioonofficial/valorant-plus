# DRILL

Açık kaynak VALORANT yardımcı uygulaması: maç istatistikleri, kişisel antrenman, aktiviteye dayalı XP ve topluluk (oyuncu bulma, sohbet, 5v5 lobiler).

> DRILL, Riot Games tarafından onaylanmamıştır ve Riot Games'in ya da Riot Games mülklerinin yapımında veya yönetiminde resmi olarak yer alan kimsenin görüş ve fikirlerini yansıtmaz. Riot Games ve ilişkili tüm mülkler Riot Games, Inc.'in ticari markaları veya tescilli ticari markalarıdır.

## Kurallar (Riot Developer Policy)

Bu proje Riot'un geliştirici politikasına uyacak şekilde tasarlandı. Katkı verirken bunları bozma:

- **Kendi beceri puanımız yok.** XP ve seviye yalnızca aktiviteden gelir (maç oynamak, antrenman, görev). ELO/MMR benzeri bir sıralama eklenmez.
- **Scouting yok.** Maç başlamadan rakiplerin rankı veya istatistiği gösterilmez.
- **Opt-in.** Bir oyuncunun verisi, hesabını bağlayıp paylaşımı açmadıysa başkalarına gösterilmez.
- **Maç sırasında avantaj sağlayan overlay yok.** Oyun içi overlay'ler yalnızca maç öncesi/sonrası kişisel veri ve sesli sohbet gösterir.
- **Bahis/kumar yok.** 1v1 ve lobiler ödülsüzdür.
- **API anahtarı istemciye girmez.** Riot anahtarı yalnızca sunucuda, `.env` içinde durur.

## Yapı

```
apps/server     Fastify + Prisma (PostgreSQL) — RSO girişi, maç eşitleme, XP, LFG
apps/desktop    Electron + React — yüklenme ekranı, giriş, panel, oyuncu bul
packages/shared Ortak tipler, XP kuralları, rank isimleri
```

## Kurulum

Gereksinimler: Node.js 20+. PostgreSQL kurulu olmasına gerek yok.

```bash
npm install

# Sunucu ayarları
cp apps/server/.env.example apps/server/.env
# Riot anahtarın yoksa geliştirme için .env içinde DEV_LOGIN=true yap.

# Veritabanı: ayrı bir terminalde açık kalsın (Docker'sız, repo içinde çalışır)
npm run db:local -w @drill/server
# Docker tercih edersen bunun yerine: docker compose up -d

npm run db:migrate                 # tabloları oluşturur
npm run db:seed -w @drill/server   # (isteğe bağlı) geliştirici kullanıcısına örnek maçlar
npm run dev:server                 # http://127.0.0.1:4000
npm run dev:desktop                # Electron uygulaması
```

Sunucu varsayılan olarak yalnızca `127.0.0.1` üzerinde dinler. Gerçek bir sunucuya kurarken `.env` içinde `HOST=0.0.0.0` yap ve önüne bir reverse proxy koy.

Ajan, harita ve rank görselleri çalışma anında topluluk tarafından işletilen [valorant-api.com](https://valorant-api.com)'dan URL olarak gelir; repoda görsel dosyası yoktur.

### Riot anahtarı olmadan geliştirme

`apps/server/.env` içinde `DEV_LOGIN=true` yaparsan giriş ekranında **Geliştirici girişi** butonu çıkar ve sahte bir kullanıcıyla girersin. Maç eşitleme ve `/content` gerçek Riot anahtarı ister. `DEV_LOGIN`'i herkese açık bir sunucuda asla açma.

### Riot anahtarı

[Riot Developer Portal](https://developer.riotgames.com/)'da ürünü kaydet ve production key + RSO istemcisi için başvur. RSO yönlendirme adresi: `<PUBLIC_URL>/auth/rso/callback`.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm test` | Birim testleri (vitest) |
| `npm run typecheck` | Tüm paketlerde TypeScript kontrolü |
| `npm run db:migrate` | Prisma migration |

## Yol haritası

- **Faz 1:** RSO girişi, panel, maç geçmişi, XP ve görevler, antrenman, oyuncu bul ← şu an
- **Faz 2:** Sohbet, haberler, arkadaşlık, moderasyon paneli
- **Faz 3:** 5v5 ve 1v1 lobiler, sesli odalar (LiveKit), oyun içi overlay'ler

## Lisans

[MIT](LICENSE). Riot Games'e ait görseller (ajan, harita, rank ikonları) bu repoya dahil edilmez.
