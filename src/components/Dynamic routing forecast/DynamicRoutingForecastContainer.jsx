import React from 'react'

const DynamicRoutingForecast = ({ regions, streamlitUrl }) => {
  if (!regions || regions.length === 0) {
    return (
      <div className="forecast-container-empty">
        Enter a postcode above to view the dynamic routing forecast
      </div>
    )
  }

  // Build the Streamlit URL with postcodes
  const STREAMLIT_BASE_URL = 'https://charge-cast-routing.streamlit.app/'
  const params = new URLSearchParams()
  params.append('postcodes', regions.map(r => r.postcode).join(','))
  const embedUrl = `${STREAMLIT_BASE_URL}?${params.toString()}&embed=true`

  console.log('🔸 Dynamic Routing - Postcodes being sent:', regions.map(r => r.postcode).join(', '))
  console.log('🔸 Dynamic Routing - Full iframe URL:', embedUrl)

  return (
    <div className="dynamic-routing-container">
      <iframe
        src={embedUrl}
        title="Dynamic Routing Forecast"
        className="forecast-iframe"
        allow="camera;clipboard-read;clipboard-write"
      />
    </div>
  )
}

export default DynamicRoutingForecast