# Katkı rehberi

DRILL'e katkı vermek istediğin için teşekkürler! Bu belge kurulumu, kuralları ve bir pull request'in nasıl kabul edildiğini anlatır.

## Önce şunu oku: Riot kuralları

DRILL, [Riot Developer Policy](https://developer.riotgames.com/policies/general)'ye uyduğu sürece yaşayabilir. Bu kuralları bozan bir PR, kodu ne kadar iyi olursa olsun **kabul edilmez**:

| Yapma | Neden |
|---|---|
| Kills, wins, K/D gibi performansa dayalı bir puan, ELO/MMR veya sıralama eklemek | Riot resmi ranked merdivenine alternatif sistemleri yasaklıyor. XP yalnızca aktiviteden gelir. |
| Maç başlamadan rakiplerin (veya takım arkadaşlarının) rankını/istatistiğini göstermek | "Scouting" onaylı bir kullanım değil. |
| Hesabını bağlayıp paylaşımı açmamış bir oyuncunun verisini başkasına göstermek | Opt-in zorunlu. |
| Maç sırasında oyun bilgisi veren overlay (ekonomi, pozisyon, canlı hasar…) | Anında avantaj sağlayan overlay'ler yasak. |
| Bahis, ödüllü 1v1, şans oyunu | Kumar yasak. |
| Riot istemcisinin resmi olmayan yerel API'sini kullanmak, oyunu otomatikleştirmek | ToS ihlali; kullanıcıların hesapları ban yiyebilir. |
| Riot görsellerini (ajan, harita, rank ikonları) uygulama koduna dosya olarak eklemek | Görseller çalışma anında URL ile gelir. Tek istisna README'deki `docs/screenshots/` tanıtım görüntüleri. |

Emin değilsen önce bir issue aç ve sor.

## Geliştirme ortamı

Gereksinim: Node.js 20+ (CI Node 22 kullanır). Docker veya PostgreSQL kurulu olması gerekmez.

```bash
git clone https://github.com/motioonofficial/valorant-plus.git
cd valorant-plus
npm install

cp apps/server/.env.example apps/server/.env
# .env içinde DEV_LOGIN=true yap (Riot anahtarı gerekmez)

npm run db:local -w @drill/server   # ayrı terminalde açık kalsın
npm run db:migrate
npm run db:seed -w @drill/server    # örnek maçlar
npm run dev:server
npm run dev:desktop
```

Giriş ekranındaki **Geliştirici girişi** ile örnek verili bir kullanıcıyla girersin.

## Proje yapısı

```
apps/server      Fastify + Prisma — API, RSO, maç eşitleme, XP, LFG
apps/desktop     Electron + React — masaüstü istemci
packages/shared  Sunucu ve istemcinin ortak tipleri ve kuralları
```

Sunucuyla istemci arasında taşınan her tip `packages/shared/src/api.ts` içinde tanımlanır. Bir uç noktayı değiştiriyorsan önce orayı güncelle.

## PR göndermeden önce

```bash
npm run typecheck
npm test
```

İkisi de geçmeli; aynı kontroller GitHub Actions'ta da her PR için çalışır.

- **Test:** Saf mantık (hesaplamalar, veri dönüşümleri) için test yaz. Örnekler: `packages/shared/src/xp.test.ts`, `apps/server/src/services/matchMapper.test.ts`.
- **Veritabanı değişikliği:** `prisma/schema.prisma`'yı değiştirdiysen `npm run db:migrate -- --name kisa-aciklama` ile bir migration oluştur ve onu da commit'le.
- **Gizli bilgi:** `.env` dosyasını veya bir API anahtarını asla commit'leme. CI bunu yakalar ve PR'ı düşürür. Yanlışlıkla commit'lediysen anahtarı Riot portalında hemen yenile.
- **Küçük tut:** Bir PR tek bir şeyi değiştirsin. Büyük bir özellik için önce issue açıp yaklaşımı konuşalım.

## Kod stili

- TypeScript `strict` modda; `any` kullanma.
- Çevredeki kodun stiline uy: isimlendirme, dosya düzeni, yorum yoğunluğu.
- Kullanıcıya görünen metinler Türkçe; kod, değişken isimleri ve commit mesajları İngilizce.
- Yorumlar *ne* değil *neden* anlatsın (özellikle Riot kurallarından gelen kararlar için).

## Commit mesajları

Kısa, emir kipinde ve İngilizce bir başlık; gerekirse altında açıklama:

```
Add weekly quest progress to the panel

Quests reset on Monday 00:00 Europe/Istanbul.
```

## Sorun bildirme

Hata bildirirken şunları yaz: ne yaptın, ne bekledin, ne oldu, işletim sistemi ve Node sürümü. Güvenlik açığı bulduysan herkese açık issue açma; repo sahibine doğrudan ulaş.

## Lisans

Katkıların projenin [MIT lisansı](LICENSE) altında yayımlanır.
