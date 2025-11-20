import { useState, useEffect } from 'react'
import { carbonAPI } from '../../../services/api'

const OptimalChargingWindowContainer = ({ regions }) => {
  const [optimalWindows, setOptimalWindows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  console.log('🔶 OptimalChargingWindowContainer - Received regions:', regions)

  useEffect(() => {
    const fetchOptimalWindows = async () => {
      console.log('🔶 Starting fetchOptimalWindows, regions:', regions)
      if (!regions || regions.length === 0) {
        console.log('🔶 No regions, returning early')
        return
      }

      setLoading(true)
      setError(null)
      console.log('🔶 Set loading to true')

      try {
        // Fetch 24h forecast data for all regions
        const forecastPromises = regions.map(region =>
          carbonAPI.getForecast48h(region.postcode)
        )
        const responses = await Promise.all(forecastPromises)
        console.log('🔶 API Responses:', responses)

        // Process each region's data
        const allWindows = []

        responses.forEach((response, index) => {
          const region = regions[index]
          
          // The API returns: { data: { data: [...actual forecast data], postcode, regionid, shortname } }
          const forecastData = response.data.data?.data
          console.log('🔶 Forecast data for', region.postcode, ':', forecastData)
          console.log('🔶 Is array?', Array.isArray(forecastData))
          console.log('🔶 Length:', forecastData?.length)

          if (!forecastData || !Array.isArray(forecastData)) {
            console.log('🔶 Skipping - invalid data structure')
            return
          }

          // Filter to only include data within next 24 hours
          const now = new Date()
          const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          const next24hData = forecastData.filter(point => {
            const pointTime = new Date(point.from)
            return pointTime >= now && pointTime <= twentyFourHoursFromNow
          })

          console.log('🔶 Data filtered to 24h:', next24hData.length, 'points')

          // Find optimal 3-hour windows
          const windows = findOptimal3HourWindows(next24hData, region)
          allWindows.push(...windows)
        })

        // Sort all windows by carbon intensity (lowest first)
        const sortedWindows = allWindows.sort((a, b) => a.avgIntensity - b.avgIntensity)
        
        // Group by region and take top 3 non-overlapping windows from each
        const windowsByRegion = {}
        sortedWindows.forEach(window => {
          if (!windowsByRegion[window.postcode]) {
            windowsByRegion[window.postcode] = []
          }
          
          // Check if this window overlaps with any already selected windows for this region
          const overlaps = windowsByRegion[window.postcode].some(selectedWindow => {
            return doWindowsOverlap(selectedWindow, window)
          })
          
          // Only add if no overlap and we haven't reached 3 windows yet
          if (!overlaps && windowsByRegion[window.postcode].length < 3) {
            windowsByRegion[window.postcode].push(window)
          }
        })

        // Flatten back to array
        const finalWindows = Object.values(windowsByRegion).flat()
        console.log('🔶 Final optimal windows:', finalWindows)
        setOptimalWindows(finalWindows)

      } catch (err) {
        console.error('🔶 Error fetching optimal windows:', err)
        setError('Failed to calculate optimal charging windows')
      } finally {
        setLoading(false)
        console.log('🔶 Set loading to false')
      }
    }

    fetchOptimalWindows()
  }, [regions])

  // Check if two windows overlap
  const doWindowsOverlap = (window1, window2) => {
    return (
      (window1.startTime < window2.endTime && window1.endTime > window2.startTime) ||
      (window2.startTime < window1.endTime && window2.endTime > window1.startTime)
    )
  }

  // Find the best 3-hour charging windows (6 consecutive 30-min periods)
  const findOptimal3HourWindows = (data, region) => {
    const windows = []
    
    // Need at least 6 data points for a 3-hour window
    if (data.length < 6) return windows

    // Create sliding 3-hour windows
    for (let i = 0; i <= data.length - 6; i++) {
      const windowData = data.slice(i, i + 6)
      
      // Calculate average intensity for this 3-hour window
      const avgIntensity = windowData.reduce((sum, point) => {
        return sum + (point.intensity?.forecast || 0)
      }, 0) / windowData.length

      const startTime = new Date(windowData[0].from)
      const endTime = new Date(windowData[5].to)

      windows.push({
        postcode: region.postcode,
        region: region.region,
        startTime,
        endTime,
        avgIntensity: Math.round(avgIntensity),
        periods: windowData
      })
    }

    return windows
  }

  const formatDateTime = (date) => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dateStr = date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    })
    
    const timeStr = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    })

    // Check if today or tomorrow
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${timeStr}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${timeStr}`
    }
    
    return `${dateStr}, ${timeStr}`
  }

  const getIntensityClass = (intensity) => {
    if (intensity < 100) return 'intensity-very-low'
    if (intensity < 150) return 'intensity-low'
    if (intensity < 200) return 'intensity-moderate'
    if (intensity < 250) return 'intensity-high'
    return 'intensity-very-high'
  }

  const getIntensityBgClass = (intensity) => {
    if (intensity < 100) return 'intensity-very-low-bg'
    if (intensity < 150) return 'intensity-low-bg'
    if (intensity < 200) return 'intensity-moderate-bg'
    if (intensity < 250) return 'intensity-high-bg'
    return 'intensity-very-high-bg'
  }

  const getIntensityLabel = (intensity) => {
    if (intensity < 100) return 'Very Low'
    if (intensity < 150) return 'Low'
    if (intensity < 200) return 'Moderate'
    if (intensity < 250) return 'High'
    return 'Very High'
  }

  console.log('🔶 Render state - loading:', loading, 'error:', error, 'windows:', optimalWindows.length)

  if (loading) {
    console.log('🔶 Rendering loading state')
    return (
      <div className="optimal-window-loading">
        <p>Calculating optimal charging windows...</p>
      </div>
    )
  }

  if (error) {
    console.log('🔶 Rendering error state')
    return (
      <div className="optimal-window-error">
        <p>{error}</p>
      </div>
    )
  }

  if (optimalWindows.length === 0) {
    console.log('🔶 No windows, returning null')
    return (
      <div className="optimal-window-empty">
        <p>No optimal windows found yet...</p>
      </div>
    )
  }

  console.log('🔶 Rendering windows:', optimalWindows.length)

  return (
    <div className="optimal-window-container">
      <div className="optimal-window-header">
        <h3 className="optimal-window-title">
          Optimal Charging Windows
        </h3>
        <div className="optimal-window-description">
          <span>🔌</span>
          <span>Recommended 3-hour charging periods with the lowest carbon intensity in the next 24 hours</span>
        </div>
      </div>

      <div className="optimal-window-list">
        {optimalWindows.map((window, index) => (
          <div
            key={`${window.postcode}-${window.startTime.getTime()}`}
            className="optimal-window-card"
          >
            <div className="optimal-window-card-left">
              <div className="optimal-window-icon">
                <span>⚡</span>
              </div>
              
              <div className="optimal-window-details">
                <div className="optimal-window-region">
                  {window.region}
                </div>
                <div className="optimal-window-time">
                  <span>🕐</span>
                  <span>
                    {formatDateTime(window.startTime)} - {window.endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>
              </div>
            </div>

            <div className="optimal-window-metrics">
              <div className={`optimal-window-intensity ${getIntensityClass(window.avgIntensity)}`}>
                {window.avgIntensity}
                <span className="optimal-window-intensity-unit">
                  gCO₂/kWh
                </span>
              </div>
              <div className={`optimal-window-intensity-label ${getIntensityClass(window.avgIntensity)} ${getIntensityBgClass(window.avgIntensity)}`}>
                {getIntensityLabel(window.avgIntensity)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {optimalWindows.length > 0 && (
        <div className="optimal-window-tip">
          <strong>💡 Tip:</strong> Charging during these windows can significantly reduce your fleet's carbon footprint. 
          The times shown are when grid electricity has the lowest carbon intensity in your region.
        </div>
      )}
    </div>
  )
}

export default OptimalChargingWindowContainer