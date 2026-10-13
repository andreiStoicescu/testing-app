"use client";
import React from "react";

export default class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.ref = React.createRef();
    this.onDocClick = this.onDocClick.bind(this);
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.onDocClick);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.onDocClick);
  }

  onDocClick(e) {
    if (this.ref.current && !this.ref.current.contains(e.target)) {
      if (this.state.open) {
        this.setState({ open: false });
        if (this.props.onBlur) this.props.onBlur();
      }
    }
  }

  render() {
    var self = this;
    var selected = this.props.options.filter(function (o) { return o.value == self.props.value; })[0];
    return (
      <div className={"dd" + (this.props.invalid ? " invalid" : "")} ref={this.ref}>
        <div className="dd-toggle" onClick={function () { self.setState({ open: !self.state.open }); }}>
          {selected ? selected.label : <span className="placeholder">{this.props.placeholder || "-- select --"}</span>}
        </div>
        {this.state.open && (
          <ul className="dd-menu">
            {this.props.options.map(function (o) {
              return (
                <li
                  key={o.value}
                  data-value={o.value}
                  className={o.value == self.props.value ? "sel" : ""}
                  onClick={function () {
                    self.props.onChange(o.value);
                    self.setState({ open: false });
                  }}
                >
                  {o.label}
                </li>
              );
            })}
          </ul>
        )}
        <input type="hidden" name={this.props.name} value={this.props.value || ""} />
      </div>
    );
  }
}
