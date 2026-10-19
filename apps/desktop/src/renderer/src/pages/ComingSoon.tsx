export function ComingSoon({ title, phase }: { title: string; phase: 1 | 2 | 3 }) {
  return (
    <>
      <div>
        <div className="eyebrow">// FAZ {phase}</div>
        <h1 className="page-title">{title.toLocaleUpperCase('tr-TR')}</h1>
      </div>
      <div className="card">
        <p className="muted" style={{ margin: 0 }}>
          Bu sayfa henüz yapılmadı. Tasarımı hazır; yol haritasındaki sırası gelince eklenecek.
        </p>
      </div>
    </>
  );
}
