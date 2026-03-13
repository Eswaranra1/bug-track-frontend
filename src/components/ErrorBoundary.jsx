import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("UI error boundary caught", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="loading-screen">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: 8 }}>Something went wrong.</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              We've logged the error. Try reloading your workspace.
            </p>
            <button type="button" className="btn btn-primary" onClick={this.handleReset}>
              Reload dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

