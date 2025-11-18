import { useState } from 'react';
import PostcodeInput from './PostcodeInput';
import { carbonAPI } from '../services/api';

function PostcodeContainer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [regions, setRegions] = useState([]);

  const handleLookup = async (postcode) => {
    setLoading(true);
    setError(null);
    setRegions([]);

    try {
      // Fetch current carbon intensity data for the postcode
      const response = await carbonAPI.getCurrent30m(postcode);
      
      // Mock regions for display (you can customize based on actual API response)
      setRegions([
        { postcode: 'DH7 9PT', region: 'North East England' },
        { postcode: 'S75 1FJ', region: 'Yorkshire' },
        { postcode: 'CO6 2NS', region: 'East England' }
      ]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to lookup DNO. Please check the postcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Fleet Operating Regions</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Select the grid regions where your eHGV fleet operates
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
          Unsure which UK Distribution Network Operator (DNO) your facility belongs to? 
          Enter your postcode here to check
        </p>
        <PostcodeInput onLookup={handleLookup} />
      </div>

      {loading && <p>Loading...</p>}
      
      {error && (
        <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>
      )}

      {regions.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          flexWrap: 'wrap',
          marginTop: '2rem' 
        }}>
          {regions.map((region, index) => (
            <div
              key={index}
              style={{
                padding: '1rem',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                border: '1px solid #4caf50',
                flex: '1 1 200px'
              }}
            >
              ✓ {region.postcode} - {region.region}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostcodeContainer;
