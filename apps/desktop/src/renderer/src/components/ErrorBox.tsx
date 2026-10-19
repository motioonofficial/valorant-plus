/** Error message with a retry button, so a failed load (e.g. server restarting) isn't a dead end. */
export function ErrorBox({ message, onRetry, style }: { message: string; onRetry?: () => void; style?: React.CSSProperties }) {
  return (
    <div className="error" role="alert" style={{ display: 'flex', alignItems: 'center', gap: 16, ...style }}>
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-ghost" style={{ minHeight: 36, fontSize: 18 }} onClick={onRetry}>
          TEKRAR DENE
        </button>
      )}
    </div>
  );
}
