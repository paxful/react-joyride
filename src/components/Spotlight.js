import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const JoyrideSpotlight = ({ styles }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [isMounted]);

  return (
    <div
      key="JoyrideSpotlight"
      className="react-joyride__spotlight"
      style={{ ...styles, backgroundColor: !isMounted ? '#404040' : '#808080' }}
    />
  );
};

JoyrideSpotlight.propTypes = {
  styles: PropTypes.object.isRequired,
};

export default JoyrideSpotlight;
