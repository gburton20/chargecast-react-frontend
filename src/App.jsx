import { useState, useEffect, useRef } from 'react'
import './App.css'
import PostcodeContainer from './components/PostcodeContainer'
import { carbonAPI } from './services/api'

function App() {
  const [selectedRegions, setSelectedRegions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const streamlitIframeRef = useRef(null)

  // Handle postcode lookup
  const handlePostcodeLookup = async (postcode) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch current carbon intensity data to validate postcode and get region
      const response = await carbonAPI.getCurrent30m(postcode)
      
      // Extract region info from API response (nested under data.data)
      const apiData = response.data?.data
      const regionData = {
        postcode: apiData?.postcode || postcode,
        region: apiData?.shortname || 'Unknown Region',
        dno: apiData?.dnoregion || apiData?.shortname || 'Unknown DNO',
        regionId: apiData?.regionid || null
      }

      // Add to selected regions if not already present
      setSelectedRegions(prev => {
        const exists = prev.some(r => r.postcode === regionData.postcode)
        if (exists) return prev
        return [...prev, regionData]
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to lookup DNO. Please check the postcode.')
    } finally {
      setLoading(false)
    }
  }

  // Remove a region from selection
  const handleRemoveRegion = (postcode) => {
    setSelectedRegions(prev => prev.filter(r => r.postcode !== postcode))
  }

  // Streamlit URL - set this to your actual Streamlit dashboard URL
  const STREAMLIT_BASE_URL = 'https://charge-cast-routing.streamlit.app/'

  // Build iframe URL with selected regions as query params
  const getStreamlitUrl = () => {
    if (selectedRegions.length === 0) return null
    
    const params = new URLSearchParams()
    params.append('postcodes', selectedRegions.map(r => r.postcode).join(','))
    params.append('regionIds', selectedRegions.map(r => r.regionId).join(','))
    params.append('regions', selectedRegions.map(r => r.region).join(','))
    
    return `${STREAMLIT_BASE_URL}?${params.toString()}`
  }

  const streamlitUrl = getStreamlitUrl()

  return (
    <div className="app-container">
      <PostcodeContainer
        regions={selectedRegions}
        loading={loading}
        error={error}
        onPostcodeLookup={handlePostcodeLookup}
        onRemoveRegion={handleRemoveRegion}
      />
      
      {streamlitUrl && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a 
            href={streamlitUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              backgroundColor: '#4CAF50',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '500',
              textAlign: 'center',
              borderRadius: '8px',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            📊 View Carbon Intensity Dashboard →
          </a>
          <p style={{ 
            marginTop: '1rem', 
            color: '#666',
            fontSize: '0.9rem'
          }}>
            Opens in a new tab with your selected regions: {selectedRegions.map(r => r.postcode).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

export default App
