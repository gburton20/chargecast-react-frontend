import { useState } from 'react';

function PostcodeInput({ onLookup }) {
  const [postcode, setPostcode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (postcode.trim()) {
      onLookup(postcode.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input
        type="text"
        value={postcode}
        onChange={(e) => setPostcode(e.target.value)}
        placeholder="e.g. SW1A 1AA"
        style={{
          padding: '0.5rem',
          fontSize: '1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
          minWidth: '200px'
        }}
      />
      <button
        type="submit"
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        🔍 Lookup DNO
      </button>
    </form>
  );
}

export default PostcodeInput;
