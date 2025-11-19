import { useState } from 'react'
import './App.css'
import PostcodeContainer from './components/PostcodeInputContainer'
import FootprintForecastContainer from './components/Footprint forecast/FootprintForecastContainer'
import DynamicRoutingForecast from './components/Dynamic routing forecast/DynamicRoutingForecastContainer'
import { carbonAPI } from './services/api'
import logo from './assets/ChargeCastLogo.svg'

function App() {
  const [selectedRegions, setSelectedRegions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('footprint') // 'footprint' or 'routing'

  // Handle postcode lookup
  const handlePostcodeLookup = async (postcode) => {
    setLoading(true)
    setError(null)

    try {
      // Fetch current carbon intensity data to validate postcode and get region
      const response = await carbonAPI.getCurrent30m(postcode)
      
      // Extract region info from API response
      // Backend returns: { data: { shortname, postcode, regionid, dnoregion, ... } }
      const responseData = response.data.data
      
      console.log('Full response:', response)
      console.log('Response data:', responseData)
      console.log('Shortname:', responseData?.shortname)
      console.log('Postcode:', responseData?.postcode)
      
      const regionData = {
        postcode: postcode, // Use the full postcode that was submitted
        region: responseData?.shortname || 'Unknown Region', // Shortname from nested data
        dno: responseData?.dnoregion || responseData?.shortname || 'Unknown DNO',
        regionId: responseData?.regionid || null // Region ID from nested data
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
    params.append('viewMode', viewMode)
    // params.append('regionIds', selectedRegions.map(r => r.regionId).join(','))
    // params.append('regions', selectedRegions.map(r => r.region).join(','))
    
    return `${STREAMLIT_BASE_URL}?${params.toString()}`
  }

  const streamlitUrl = getStreamlitUrl()

  return (
    <div className="app-container">
      <img src={logo} alt="ChargeCast Logo" />
      <h2 style={{ marginBottom: '0.5rem' }}>Forecast and minimise the carbon intensity of your fleet's Scope 2 emissions</h2>

      <PostcodeContainer
        regions={selectedRegions}
        loading={loading}
        error={error}
        onPostcodeLookup={handlePostcodeLookup}
        onRemoveRegion={handleRemoveRegion}
      />
      
      {/* Toggle for view mode selection */}
      <div style={{ 
        marginTop: '2rem', 
        display: 'flex', 
        justifyContent: 'center',
        gap: '0'
      }}>
        <button
          onClick={() => setViewMode('footprint')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            backgroundColor: viewMode === 'footprint' ? 'white' : '#f5f5f5',
            color: viewMode === 'footprint' ? '#333' : '#666',
            cursor: 'pointer',
            borderRadius: '8px 0 0 8px',
            fontWeight: viewMode === 'footprint' ? '500' : '400',
            transition: 'all 0.2s ease',
            borderRight: 'none'
          }}
        >
          Footprint forecast
        </button>
        <button
          onClick={() => setViewMode('routing')}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            backgroundColor: viewMode === 'routing' ? 'white' : '#f5f5f5',
            color: viewMode === 'routing' ? '#333' : '#666',
            cursor: 'pointer',
            borderRadius: '0 8px 8px 0',
            fontWeight: viewMode === 'routing' ? '500' : '400',
            transition: 'all 0.2s ease'
          }}
        >
          Dynamic routing forecast
        </button>
      </div>
      
      {/* Conditionally render the appropriate forecast component */}
      {selectedRegions.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          {viewMode === 'footprint' ? (
            <FootprintForecastContainer 
              regions={selectedRegions}
              streamlitUrl={streamlitUrl}
            />
          ) : (
            <DynamicRoutingForecast 
              regions={selectedRegions}
              streamlitUrl={streamlitUrl}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default App
