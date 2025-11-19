import PostcodeInput from './PostcodeInput';

function PostcodeContainer({ regions, loading, error, onPostcodeLookup, onRemoveRegion }) {

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>

      <div style={{ marginBottom: '2rem' }}>
        <p style={{ marginBottom: '1rem', fontWeight: '500' }}>
          Enter the <strong>full UK postcode</strong> of your fleet operational sites (one at a time):
        </p>
        <PostcodeInput onLookup={onPostcodeLookup} />
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
                flex: '1 1 200px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>✓ {region.postcode} - {region.region}</span>
              <button
                onClick={() => onRemoveRegion(region.postcode)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0 0.5rem'
                }}
                title="Remove region"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostcodeContainer;
