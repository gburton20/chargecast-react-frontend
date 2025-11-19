import React from 'react'

const DynamicRoutingForecast = ({ regions, streamlitUrl }) => {
  if (!regions || regions.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#666',
        fontStyle: 'italic' 
      }}>
        Enter a postcode above to view the dynamic routing forecast
      </div>
    )
  }

  // Build the Streamlit URL with postcodes
  const STREAMLIT_BASE_URL = 'http://charge-cast-routing.streamlit.app/'
  const params = new URLSearchParams()
  params.append('postcodes', regions.map(r => r.postcode).join(','))
  const embedUrl = `${STREAMLIT_BASE_URL}?${params.toString()}&embed=true`

  return (
    <div style={{ 
      width: '100%', 
      marginTop: '2rem',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <iframe
        src={embedUrl}
        title="Dynamic Routing Forecast"
        style={{
          width: '100%',
          height: '800px',
          border: 'none',
          display: 'block'
        }}
        allow="camera;clipboard-read;clipboard-write"
      />
    </div>
  )
}

export default DynamicRoutingForecast