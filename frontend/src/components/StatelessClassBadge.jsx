import React from "react";

export default class StatelessClassBadge extends React.Component {
  render() {
    const { label } = this.props;
    return (
      <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
        {label}
      </span>
    );
  }
}
