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
  const STREAMLIT_BASE_URL = 'https://charge-cast-routing.streamlit.app/?embed=true'

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
        <div className="streamlit-container">
          <iframe
            ref={streamlitIframeRef}
            src={streamlitUrl}
            title="ChargeCast Dashboard"
            style={{
              width: '100%',
              height: '800px',
              border: 'none',
              marginTop: '2rem'
            }}
            allow="cross-origin-isolated"
          />
        </div>
      )}
    </div>
  )
}

export default App
