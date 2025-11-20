import PostcodeInput from './PostcodeInput';

function PostcodeContainer({ regions, loading, error, onPostcodeLookup, onRemoveRegion }) {

  return (
    <div className="postcode-container">

      <div>
        <p className="postcode-container-intro">
          Enter the <strong>full UK postcode</strong> of your fleet operational sites (one at a time):
        </p>
        <PostcodeInput onLookup={onPostcodeLookup} />
      </div>

      {loading && <p>Loading...</p>}
      
      {error && (
        <p className="postcode-error">{error}</p>
      )}

      {regions.length > 0 && (
        <div className="selected-regions">
          {regions.map((region, index) => (
            <div key={index} className="region-card">
              <span>✓ {region.postcode} - {region.region} Distribution Network Operator (DNO) region</span>
              <button
                onClick={() => onRemoveRegion(region.postcode)}
                className="region-remove-button"
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
