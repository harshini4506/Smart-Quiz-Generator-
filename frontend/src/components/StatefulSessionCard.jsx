import React from "react";

export default class StatefulSessionCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = { secondsOpen: 0 };
    this.timer = null;
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState((prev) => ({ secondsOpen: prev.secondsOpen + 1 }));
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  render() {
    const { userName } = this.props;
    const { secondsOpen } = this.state;

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-gray-800 shadow-md">
        <p className="text-lg font-bold">Session running: {secondsOpen}s</p>
        <p className="text-sm text-gray-600">Active learner: {userName || "Learner"}</p>
      </div>
    );
  }
}
