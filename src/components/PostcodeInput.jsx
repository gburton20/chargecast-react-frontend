import { useState } from 'react';

function PostcodeInput({ onLookup }) {
  const [postcode, setPostcode] = useState('');
  const [validationError, setValidationError] = useState('');

  // UK postcode regex: validates full postcode with space
  // Format: AA9A 9AA, A9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA
  const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s\d[A-Z]{2}$/i;

  // Auto-format postcode: add space if missing but valid pattern detected
  const formatPostcode = (value) => {
    // Remove existing spaces and convert to uppercase
    const cleaned = value.replace(/\s/g, '').toUpperCase();
    
    // Try to add space in the correct position (last 3 chars = inward code)
    if (cleaned.length >= 5 && cleaned.length <= 7) {
      const inward = cleaned.slice(-3);
      const outward = cleaned.slice(0, -3);
      return `${outward} ${inward}`;
    }
    
    return value.toUpperCase();
  };

  const validatePostcode = (value) => {
    const formatted = formatPostcode(value);
    
    if (!formatted.trim()) {
      return { isValid: false, error: '' };
    }
    
    if (!UK_POSTCODE_REGEX.test(formatted)) {
      return { 
        isValid: false, 
        error: 'Please enter a full UK postcode with a space (e.g., SW1A 1AA, M1 1AE, B33 8TH)' 
      };
    }
    
    return { isValid: true, error: '', formatted };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');
    
    const validation = validatePostcode(postcode);
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }
    
    onLookup(validation.formatted);
    setPostcode(''); // Clear input after successful submission
  };

  const handleChange = (e) => {
    setPostcode(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, maxWidth: '250px' }}>
          <input
            type="text"
            value={postcode}
            onChange={handleChange}
            placeholder="e.g. SW1A 1AA"
            maxLength="8"
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              border: `1px solid ${validationError ? '#dc3545' : '#ccc'}`,
              borderRadius: '4px',
              width: '100%',
              outline: validationError ? '1px solid #dc3545' : 'none'
            }}
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'postcode-error' : undefined}
          />
          {validationError && (
            <p 
              id="postcode-error"
              style={{ 
                color: '#dc3545', 
                fontSize: '0.85rem', 
                marginTop: '0.25rem',
                marginBottom: 0
              }}
            >
              {validationError}
            </p>
          )}
        </div>
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Submit
        </button>
      </form>
      <p style={{ 
        fontSize: '0.85rem', 
        color: '#666', 
        marginTop: '0.5rem',
        fontStyle: 'italic'
      }}>
        Must include space (e.g., SW1A 1AA, M1 1AE, B33 8TH)
      </p>
    </div>
  );
}

export default PostcodeInput;
