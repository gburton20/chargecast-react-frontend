import React from 'react'
import OptimalChargingWindowContainer from './Optimal charging window/OptimalChargingWindowContainer'
import Scope2EmissionsContainer from './Scope2EmissionsContainer'

const MAGIC_POSTCODES = ['DH7 9PT', 'S75 1FJ', 'CO6 2NS'];

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

  // Check if any of the entered postcodes are "magic" postcodes for Scope 2 emissions
  const magicPostcodes = regions.filter(r => 
    MAGIC_POSTCODES.includes(r.postcode.toUpperCase().replace(/\s+/g, ' ').trim())
  );

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
      
      {magicPostcodes.length > 0 && (
        <Scope2EmissionsContainer 
          postcode={magicPostcodes[0].postcode}
          allPostcodes={magicPostcodes.map(r => r.postcode)}
        />
      )}
    </div>
  )
}

export default FootprintForecastContainer