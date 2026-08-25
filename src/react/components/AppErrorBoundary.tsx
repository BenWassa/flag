import { Component, type ErrorInfo, type ReactNode } from 'react';

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Atlas could not render.', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="page"><div className="empty-state" role="alert"><strong tabIndex={-1} data-autofocus>Atlas could not open this screen</strong><span>Your saved progress is still on this device. Reload Atlas to try again.</span></div><div className="result-actions"><button className="button button--primary" type="button" onClick={() => window.location.reload()}>Reload Atlas</button></div></main>;
  }
}
