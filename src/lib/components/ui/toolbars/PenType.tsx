import React from 'react';

const PenType = () => {

  const selectStyle: React.CSSProperties = {
    backgroundColor: 'white',
    color: 'black',
    padding: '0.25em',
    borderRadius: '0.5em',
    border: '0px solid black',
    cursor: 'pointer',
    width: '3rem',
  }

  return <>
    <select style={selectStyle}>
      <option value="pen">🖋</option>
      <option value="mouse">🖱</option>
      <option value="touch">👉</option>
    </select>
  </>
}

export { PenType };
