export function LoadingState({ message = "Loading campus spaces…" }) {
  return <div className="page-state"><span className="loader" /><p>{message}</p></div>;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="page-state error-state" role="alert">
      <span>!</span>
      <h2>We couldn’t load this page.</h2>
      <p>{message}</p>
      {onRetry && <button className="button primary" type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}
