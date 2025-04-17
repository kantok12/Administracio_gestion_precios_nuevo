import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- Interfaz para los datos de pricingOverrides ---
interface PricingOverride {
  category: string;
  exchange_rate_eur_usd: number;
  buffer_transport: number;
  insurance_rate: number;
  observed_usd: number;
  buffer_usd: number;
  additional_margin: number;
  original_factory_cost_eur: number;
  manufacturer_discount: number;
  last_update: string;
}

export default function AdminPanel() {
  const [pricingOverrides, setPricingOverrides] = useState<PricingOverride[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from the backend
  const fetchPricingOverrides = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/pricingOverrides');
      setPricingOverrides(response.data);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingOverrides();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <h1>Admin Panel - Pricing Overrides</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '8px' }}>Category</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Exchange Rate (EUR/USD)</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Buffer Transport</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Insurance Rate</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Observed USD</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Buffer USD</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Additional Margin</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Original Factory Cost (EUR)</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Manufacturer Discount</th>
              <th style={{ border: '1px solid black', padding: '8px' }}>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {pricingOverrides.map((override) => (
              <tr key={override.category}>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.category}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.exchange_rate_eur_usd}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.buffer_transport}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.insurance_rate}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.observed_usd}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.buffer_usd}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.additional_margin}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.original_factory_cost_eur}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{override.manufacturer_discount}</td>
                <td style={{ border: '1px solid black', padding: '8px' }}>{new Date(override.last_update).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}