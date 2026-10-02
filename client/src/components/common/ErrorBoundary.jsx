import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
        <img src="/images/logo.png" alt="Omkari Fashions" className="mb-6 h-20 w-20" />
        <h1 className="font-display text-3xl font-bold text-brand-heading">Something went wrong</h1>
        <p className="mt-2 max-w-md text-brand-text">An unexpected error occurred while displaying this page. Please reload and try again.</p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Reload page</button>
          <a href="/" className="btn-outline">Go to home</a>
        </div>
      </div>
    );
  }
}
