import React, { useState, useEffect } from 'react';
import { USAGE_DATA, FACILITY_NAMES } from './usageData';

const Scope2EmissionsContainer = ({ postcode, allPostcodes = [] }) => {
  const [carbonData, setCarbonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emissions, setEmissions] = useState(null);
  const [selectedPostcode, setSelectedPostcode] = useState(postcode);

  // Get all available magic postcodes from the entered postcodes
  const availablePostcodes = allPostcodes
    .map(pc => pc.toUpperCase().replace(/\s+/g, ' ').trim())
    .filter(pc => USAGE_DATA[pc]);

  const normalizedPostcode = selectedPostcode.toUpperCase().replace(/\s+/g, ' ').trim();
  const facilityName = FACILITY_NAMES[normalizedPostcode] || normalizedPostcode;

  useEffect(() => {
    const fetchCarbonData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://chargecast-backend.onrender.com/api/v1/carbon/regional/history-7d/?postcode=${normalizedPostcode}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch carbon intensity data');
        }
        
        const data = await response.json();
        
        // Extract the data array from the response
        const carbonIntensityArray = data.data?.data || [];
        setCarbonData(carbonIntensityArray);
        
        // Calculate Scope 2 emissions
        calculateEmissions(carbonIntensityArray);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCarbonData();
  }, [normalizedPostcode]);

  const calculateEmissions = (carbonIntensityData) => {
    const usageData = USAGE_DATA[normalizedPostcode];
    
    if (!usageData || !carbonIntensityData) {
      setEmissions(null);
      return;
    }

    let totalEmissions = 0;
    let matchedIntervals = 0;
    const dailyBreakdown = {};

    usageData.forEach(usage => {
      // Find matching carbon intensity data point
      const carbonPoint = carbonIntensityData.find(c => {
        const carbonTime = new Date(c.from).getTime();
        const usageTime = new Date(usage.from).getTime();
        return Math.abs(carbonTime - usageTime) < 30 * 60 * 1000; // Within 30 minutes
      });

      if (carbonPoint) {
        // Emissions (kg CO2e) = Usage (kWh) × Carbon Intensity (g CO2e/kWh) / 1000
        // Extract intensity value: use forecast if available, otherwise use actual
        let intensityValue;
        if (typeof carbonPoint.intensity === 'number') {
          intensityValue = carbonPoint.intensity;
        } else if (carbonPoint.intensity?.forecast !== undefined && carbonPoint.intensity?.forecast !== null) {
          intensityValue = carbonPoint.intensity.forecast;
        } else if (carbonPoint.intensity?.actual !== undefined && carbonPoint.intensity?.actual !== null) {
          intensityValue = carbonPoint.intensity.actual;
        }
        
        // Only calculate emissions if we have a valid intensity value
        if (intensityValue !== undefined && intensityValue !== null && !isNaN(intensityValue)) {
          const emissionsKg = (usage.kwh * intensityValue) / 1000;
          totalEmissions += emissionsKg;
          matchedIntervals++;

          // Group by day
          const day = usage.from.split(' ')[0];
          if (!dailyBreakdown[day]) {
            dailyBreakdown[day] = { emissions: 0, usage: 0, count: 0 };
          }
          dailyBreakdown[day].emissions += emissionsKg;
          dailyBreakdown[day].usage += usage.kwh;
          dailyBreakdown[day].count++;
        }
      }
    });

    const totalUsage = usageData.reduce((sum, u) => sum + u.kwh, 0);
    const avgIntensity = totalEmissions > 0 ? (totalEmissions * 1000) / totalUsage : 0;

    setEmissions({
      total: totalEmissions,
      totalUsage,
      avgIntensity,
      matchedIntervals,
      totalIntervals: usageData.length,
      dailyBreakdown: Object.entries(dailyBreakdown).map(([date, data]) => ({
        date,
        emissions: data.emissions,
        usage: data.usage,
        avgIntensity: (data.emissions * 1000) / data.usage
      }))
    });
  };

  if (loading) {
    return (
      <div className="scope2-container">
        <div className="scope2-loading">
          Loading Scope 2 emissions data for {facilityName}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scope2-container">
        <div className="scope2-error">
          Error loading emissions data: {error}
        </div>
      </div>
    );
  }

  if (!emissions) {
    return (
      <div className="scope2-container">
        <div className="scope2-error">
          Unable to calculate emissions - insufficient data
        </div>
      </div>
    );
  }

  return (
    <div className="scope2-container">
      <div className="scope2-header">
        <h3>Scope 2 emissions estimate for the past week 🏭</h3>
        
        {availablePostcodes.length > 1 && (
          <div className="scope2-postcode-toggle">
            <label htmlFor="postcode-select">View facility: </label>
            <select 
              id="postcode-select"
              value={selectedPostcode}
              onChange={(e) => setSelectedPostcode(e.target.value)}
              className="scope2-postcode-select"
            >
              {availablePostcodes.map(pc => (
                <option key={pc} value={pc}>
                  {pc} - {FACILITY_NAMES[pc] || pc}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

    <div className="scope2-carbon-price-statement">
      <em>The 2025 UK carbon price is £41.84 per tCO2e (
        <a 
          href="https://www.gov.uk/government/publications/determinations-of-the-uk-ets-carbon-price/uk-ets-carbon-prices-for-use-in-civil-penalties-2025" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          source
        </a>)
      </em>
    </div>


      <div className="scope2-summary">
        <div className="scope2-stat">
          <div className="scope2-stat-value">{emissions.total.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</div>
          <div className="scope2-stat-label">kg CO₂e</div>
          <div className="scope2-stat-sublabel">Total emissions (for the previous seven days)</div>
        </div>

        <div className="scope2-stat">
          <div className="scope2-stat-value">{emissions.totalUsage.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</div>
          <div className="scope2-stat-label">kWh</div>
          <div className="scope2-stat-sublabel">Total electricity usage (for the previous seven days)</div>
        </div>

        <div className="scope2-stat">
          <div className="scope2-stat-value">{emissions.avgIntensity.toFixed(0)}</div>
          <div className="scope2-stat-label">g CO₂e/kWh</div>
          <div className="scope2-stat-sublabel">Average carbon intensity for this DNO (across the previous seven days)</div>
        </div>
      </div>

      <div className="scope2-daily">
        <h4>Daily Breakdown</h4>
        <div className="scope2-daily-list">
          {emissions.dailyBreakdown.map(day => (
            <div key={day.date} className="scope2-daily-item">
              <div className="scope2-daily-date">
                {new Date(day.date).toLocaleDateString('en-GB', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </div>
              <div className="scope2-daily-values">
                <span className="scope2-daily-emissions">
                  {day.emissions.toFixed(0)} kg CO₂e
                </span>
                <span className="scope2-daily-usage">
                  {day.usage.toLocaleString('en-GB', { maximumFractionDigits: 0 })} kWh
                </span>
                <span className="scope2-daily-intensity">
                  {day.avgIntensity.toFixed(0)} gCO2/kWh
                </span>
              </div>
              <button 
                className="postcode-submit-button"
                onClick={() => {
                  const csvContent = `Date,Emissions (kg CO₂e),Usage (kWh),Average Intensity (gCO2/kWh)\n${day.date},${day.emissions.toFixed(2)},${day.usage.toFixed(2)},${day.avgIntensity.toFixed(2)}`;
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `emissions-${day.date}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
                title="Export day data to CSV"
              >
                Export
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="scope2-footer">
        <p>
          📊 Calculated from {emissions.matchedIntervals} matched 30-minute intervals
        </p>
        <p className="scope2-methodology">
          Methodology: Scope 2 emissions (kg CO2e) = Electricity usage (kWh) × Regional Carbon Intensity (g CO₂e/kWh / 1,000)
        </p>
      </div>
    </div>
  );
};

export default Scope2EmissionsContainer;
