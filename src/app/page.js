'use client'
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function StoreForm() {
  const [searchCode, setSearchCode] = useState('');
  const [storeData, setStoreData] = useState(null);
  const [postcardStatus, setPostcardStatus] = useState(''); 
  const [packsMade, setPacksMade] = useState('No');
  const [startedDistribution, setStartedDistribution] = useState('No');
  const [status, setStatus] = useState('');

  const fetchStore = async () => {
    setStatus('Loading...');
    const { data, error } = await supabase
      .from('Stores')
      .select('*')
      .eq('Store_Code', searchCode.toUpperCase())
      .single();

    if (error || !data) {
      setStatus('Store not found. Please verify the Store Code.');
      setStoreData(null);
    } else {
      setStoreData(data);
      setStatus('');
      
      const { data: pcData } = await supabase
        .from('postcard_tracking')
        .select('*')
        .eq('store_code', data.Store_Code)
        .single();

      if (pcData) {
        setPostcardStatus(pcData.postcard_status || '');
        setPacksMade(pcData.packs_made ? 'Yes' : 'No');
        setStartedDistribution(pcData.started_distribution ? 'Yes' : 'No');
      } else {
        if (data.City?.toLowerCase() === 'chennai') {
          setPostcardStatus('chennai_yes');
        } else {
          setPostcardStatus('rotn_yes');
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving updates...');

    const { error: storeErr } = await supabase
      .from('Stores')
      .update({
        City: storeData.City,
        SM: storeData.SM,
        SM_Mobile: storeData.SM_Mobile
      })
      .eq('Store_Code', storeData.Store_Code);

    const { error: pcErr } = await supabase
      .from('postcard_tracking')
      .upsert({
        store_code: storeData.Store_Code,
        postcard_status: postcardStatus,
        packs_made: postcardStatus === 'chennai_yes' ? (packsMade === 'Yes') : false,
        started_distribution: postcardStatus === 'rotn_yes' ? (startedDistribution === 'Yes') : false,
        updated_at: new Date()
      }, { onConflict: 'store_code' });

    if (storeErr || pcErr) {
      setStatus('Error saving data. Please contact regional support.');
    } else {
      setStatus('Successfully updated operational data! Thank you.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px', backgroundColor: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', overflow: 'hidden', padding: '28px 24px' }}>
        
        {/* Sleek Branding Minimal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.025em', color: '#0f172a', margin: '0' }}>TRENDS</h2>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', uppercase: 'true', letterSpacing: '0.1em', margin: '4px 0 0 0' }}>STORE PROFILE UPDATE</p>
        </div>
        
        {!storeData ? (
          /* Premium Input Screen */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enter Store Code</label>
              <input 
                type="text" 
                style={{ w: '100%', border: 'none', borderBottom: '2px solid #cbd5e1', outline: 'none', padding: '8px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.2s' }}
                placeholder="E.G. TAV7"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
            </div>
            
            <button 
              onClick={fetchStore} 
              style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)' }}
            >
              Verify Store Code
            </button>
            
            {status && <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '12px', border: '1px solid #fee2e2', textAlign: 'center', margin: '0' }}>{status}</p>}
          </div>
        ) : (
          /* Smooth Mobile Form View */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            
            {/* Context Header */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px 16px' }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>Active Workspace</p>
              <p style={{ fontSize: '14px', fontWeight: '800', color: '#334155', margin: '2px 0 0 0', lineHeight: '1.4' }}>{storeData.Store_Code} — {storeData.Store_Name}</p>
            </div>

            {/* Inputs Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City</label>
                <input 
                  type="text" 
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', padding: '6px 0', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}
                  value={storeData.City || ''}
                  onChange={(e) => setStoreData({...storeData, City: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Store Manager Name</label>
                <input 
                  type="text" 
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', padding: '6px 0', fontSize: '15px', fontWeight: '600', color: '#0f172a' }}
                  placeholder="Enter full name"
                  value={storeData.SM || ''}
                  onChange={(e) => setStoreData({...storeData, SM: e.target.value})}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SM Mobile Number</label>
                <input 
                  type="number" 
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid #e2e8f0', outline: 'none', padding: '6px 0', fontSize: '15px', fontWeight: '600', color: '#0f172a', letterSpacing: '0.02em' }}
                  placeholder="Enter 10-digit number"
                  value={storeData.SM_Mobile || ''}
                  onChange={(e) => setStoreData({...storeData, SM_Mobile: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Campaign Logistics Selection Card */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Campaign Visual Reference Box */}
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Campaign Postcard Reference</p>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100px' }}>
                  {/* Using standard absolute path configuration to load the image flawlessly */}
                  <img 
                    src="/postcard.png" 
                    alt="TRENDS Coupon Postcard" 
                    style={{ width: '100%', height: 'auto', maxHeight: '120px', objectFit: 'contain', display: 'block' }}
                    onError={(e) => {
                      // Fallback visual indicator if local deployment routing delay hits
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', lineHeight: '1.4' }}>Have you received post cards from Vendor?</label>
                <select 
                  style={{ width: '100%', border: '1px solid #e2e8f0', outline: 'none', padding: '12px', borderRadius: '12px', backgroundColor: '#ffffff', fontSize: '14px', fontWeight: '600', color: '#334155', height: '48px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                  value={postcardStatus}
                  onChange={(e) => setPostcardStatus(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select Status --</option>
                  <option value="chennai_yes">Chennai store - yes received it</option>
                  <option value="rotn_yes">RoTN store received it</option>
                  <option value="not_received">Not yet received</option>
                </select>
              </div>

              {/* Chennai Conditions Box */}
              {postcardStatus === 'chennai_yes' && (
                <div style={{ padding: '14px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#1e3a8a', lineHeight: '1.4' }}>Have you made bundles of 500 and kept it ready for dispatch to Zepto?</label>
                  <select 
                    style={{ width: '100%', border: '1px solid #dbeafe', outline: 'none', padding: '10px', borderRadius: '10px', backgroundColor: '#ffffff', fontSize: '13px', fontWeight: '600', color: '#1e40af' }}
                    value={packsMade}
                    onChange={(e) => setPacksMade(e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              )}

              {/* RoTN Conditions Box */}
              {postcardStatus === 'rotn_yes' && (
                <div style={{ padding: '14px', border: '1px solid #a7f3d0', backgroundColor: '#ecfdf5', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#064e3b', lineHeight: '1.4' }}>Have you started localized neighborhood distribution?</label>
                  <select 
                    style={{ width: '100%', border: '1px solid #d1fae5', outline: 'none', padding: '10px', borderRadius: '10px', backgroundColor: '#ffffff', fontSize: '13px', fontWeight: '600', color: '#065f46' }}
                    value={startedDistribution}
                    onChange={(e) => setStartedDistribution(e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              )}

              {/* Exception Handling Info Box */}
              {postcardStatus === 'not_received' && (
                <div style={{ padding: '14px', border: '1px solid #fde68a', backgroundColor: '#fffbef', borderRadius: '14px', fontSize: '12px', color: '#78350f', lineHeight: '1.5' }}>
                  <span style={{ fontStyle: 'normal', fontWeight: '800', textTransform: 'uppercase', display: 'block', fontSize: '10px', color: '#92400e', marginBottom: '2px' }}>Required Action</span>
                  Please check for the **POD number** from your dispatch vendor immediately and verify delivery transit status.
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div style={{ paddingTop: '4px' }}>
              <button 
                type="submit" 
                style={{ width: '100%', backgroundColor: '#059669', color: '#ffffff', padding: '14px', borderRadius: '12px', fontSize: '16px', fontWeight: '700', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)' }}
              >
                Log Operational Updates
              </button>
            </div>
            
            {status && (
              <p style={{ textAlign: 'center', fontWeight: '700', padding: '12px', borderRadius: '12px', fontSize: '12px', margin: '0', backgroundColor: status.includes('Successfully') ? '#ecfdf5' : '#eff6ff', color: status.includes('Successfully') ? '#047857' : '#1d4ed8', border: status.includes('Successfully') ? '1px solid #a7f3d0' : '1px solid #bfdbfe' }}>
                {status}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
