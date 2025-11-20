import React from 'react'
import OptimalChargingWindowContainer from './Optimal charging window/OptimalChargingWindowContainer'

const FootprintForecastContainer = ({ regions, streamlitUrl }) => {
  if (!regions || regions.length === 0) {
    return (
      <div className="forecast-container-empty">
        Enter a postcode above to view the carbon footprint forecast
      </div>
    )
  }

  // Build the Streamlit URL with postcodes
  const STREAMLIT_BASE_URL = 'https://charge-cast.streamlit.app/'
  const params = new URLSearchParams()
  params.append('postcodes', regions.map(r => r.postcode).join(','))
  const embedUrl = `${STREAMLIT_BASE_URL}?${params.toString()}&embed=true`

  console.log('🔹 Footprint Forecast - Postcodes being sent:', regions.map(r => r.postcode).join(', '))
  console.log('🔹 Footprint Forecast - Full iframe URL:', embedUrl)

  return (
    <div className="forecast-container">
      <div className="forecast-iframe-wrapper">
        <iframe
          src={embedUrl}
          title="Carbon Footprint Forecast"
          className="forecast-iframe"
          allow="camera;clipboard-read;clipboard-write"
        />
      </div>
      
      <OptimalChargingWindowContainer regions={regions}/>
    </div>
  )
}

export default FootprintForecastContainer