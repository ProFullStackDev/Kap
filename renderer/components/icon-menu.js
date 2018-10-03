import React from 'react';
import PropTypes from 'prop-types';

class IconMenu extends React.Component {
  container = React.createRef();

  openMenu = event => {
    const boundingRect = this.container.current.getBoundingClientRect();
    const {bottom, left} = boundingRect;
    const {onOpen} = this.props;
    event.stopPropagation();

    if (onOpen) {
      onOpen({
        x: Math.round(left),
        y: Math.round(bottom)
      });
    }
  }

  render() {
    const {children} = this.props;
    return (
      <div ref={this.container} onClick={this.openMenu}>
        {children}
        <style jsx>{`
          display: flex;
          align-items: center;
          justify-content: center;
        `}</style>
      </div>
    );
  }
}

IconMenu.propTypes = {
  onOpen: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
};

export default IconMenu;
