import React, { useState, useEffect } from 'react';
import { USAGE_DATA, FACILITY_NAMES } from './usageData';

const Scope2EmissionsContainer = ({ postcode }) => {
  const [carbonData, setCarbonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emissions, setEmissions] = useState(null);

  const normalizedPostcode = postcode.toUpperCase().replace(/\s+/g, ' ').trim();
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
        const intensityValue = carbonPoint.intensity?.forecast || carbonPoint.intensity;
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
        <h3>🏭 Scope 2 Emissions Report for the past week</h3>
        <p className="scope2-facility">{facilityName}</p>
      </div>

      <div className="scope2-summary">
        <div className="scope2-stat">
          <div className="scope2-stat-value">{emissions.total.toFixed(2)}</div>
          <div className="scope2-stat-label">kg CO₂e</div>
          <div className="scope2-stat-sublabel">Total Emissions (7 days)</div>
        </div>

        <div className="scope2-stat">
          <div className="scope2-stat-value">{emissions.totalUsage.toFixed(0)}</div>
          <div className="scope2-stat-label">kWh</div>
          <div className="scope2-stat-sublabel">Total Usage</div>
        </div>

        <div className="scope2-stat">
          <div className="scope2-stat-value">{emissions.avgIntensity.toFixed(0)}</div>
          <div className="scope2-stat-label">g CO₂e/kWh</div>
          <div className="scope2-stat-sublabel">Average Intensity</div>
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
                  {day.emissions.toFixed(2)} kg CO₂e
                </span>
                <span className="scope2-daily-usage">
                  {day.usage.toFixed(0)} kWh
                </span>
                <span className="scope2-daily-intensity">
                  {day.avgIntensity.toFixed(0)} g/kWh
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scope2-footer">
        <p>
          📊 Calculated from {emissions.matchedIntervals} matched 30-minute intervals
        </p>
        <p className="scope2-methodology">
          Methodology: Emissions = Usage (kWh) × Regional Carbon Intensity (g CO₂e/kWh)
        </p>
      </div>
    </div>
  );
};

export default Scope2EmissionsContainer;
