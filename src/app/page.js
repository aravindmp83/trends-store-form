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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-800 font-sans antialiased">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden px-6 py-8 space-y-6">
        
        {/* Sleek Branding Minimal Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">TRENDS</h2>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Update Store Profile</p>
        </div>
        
        {!storeData ? (
          /* Premium Input Screen */
          <div className="space-y-5 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Store Code</label>
              <input 
                type="text" 
                className="w-full border-b-2 border-slate-200 focus:border-blue-600 outline-none py-2 text-xl font-bold text-slate-900 tracking-widest uppercase transition-all bg-transparent placeholder-slate-300"
                placeholder="E.G. TAV7"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
              />
            </div>
            
            <button 
              onClick={fetchStore} 
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold tracking-wide transition-all text-base shadow-lg shadow-blue-100 mt-2"
            >
              Verify Store Code
            </button>
            
            {status && <p className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center">{status}</p>}
          </div>
        ) : (
          /* Smooth Mobile Form View */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Context Header */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Workspace</p>
              <p className="text-base font-extrabold text-slate-800">{storeData.Store_Code} — {storeData.Store_Name}</p>
            </div>

            {/* Premium Floating-Style Input Fields */}
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">City</label>
                <input 
                  type="text" 
                  className="w-full border-b border-slate-200 focus:border-blue-600 outline-none py-1.5 text-base font-semibold text-slate-900 transition-all bg-transparent"
                  value={storeData.City || ''}
                  onChange={(e) => setStoreData({...storeData, City: e.target.value})}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Store Manager Name</label>
                <input 
                  type="text" 
                  className="w-full border-b border-slate-200 focus:border-blue-600 outline-none py-1.5 text-base font-semibold text-slate-900 transition-all bg-transparent placeholder-slate-300"
                  placeholder="Enter full name"
                  value={storeData.SM || ''}
                  onChange={(e) => setStoreData({...storeData, SM: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">SM Mobile Number</label>
                <input 
                  type="number" 
                  className="w-full border-b border-slate-200 focus:border-blue-600 outline-none py-1.5 text-base font-semibold text-slate-900 transition-all bg-transparent tracking-wide placeholder-slate-300"
                  placeholder="Enter 10-digit number"
                  value={storeData.SM_Mobile || ''}
                  onChange={(e) => setStoreData({...storeData, SM_Mobile: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Campaign Visual and Status Question */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              
              {/* Postcard Image directly linked above the question */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase text-center tracking-wider mb-2">Campaign Reference Media</p>
                <div className="w-full rounded-lg overflow-hidden bg-white shadow-sm border border-slate-100">
                  <img 
                    src="/postcard.png" 
                    alt="Campaign Postcard Reference" 
                    className="w-full h-auto max-h-[140px] object-contain mx-auto"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Have you received post cards from Vendor?</label>
                <select 
                  className="w-full border border-slate-200 focus:border-blue-600 outline-none p-3 rounded-xl bg-white font-semibold text-slate-700 h-12 shadow-sm text-sm"
                  value={postcardStatus}
                  onChange={(e) => setPostcardStatus(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select Current Status --</option>
                  <option value="chennai_yes">Chennai store - yes received it</option>
                  <option value="rotn_yes">RoTN store received it</option>
                  <option value="not_received">Not yet received</option>
                </select>
              </div>

              {/* Conditional Options Render Blocks */}
              {postcardStatus === 'chennai_yes' && (
                <div className="p-4 border border-blue-100 bg-blue-50/40 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-blue-900 leading-normal">Have you made bundles of 500 and kept it ready for dispatch to Zepto?</label>
                  <select 
                    className="w-full border border-slate-200 focus:border-blue-600 outline-none p-2.5 rounded-lg bg-white font-semibold text-slate-700 text-sm"
                    value={packsMade}
                    onChange={(e) => setPacksMade(e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              )}

              {postcardStatus === 'rotn_yes' && (
                <div className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl space-y-2">
                  <label className="block text-xs font-bold text-emerald-900 leading-normal">Have you started localized neighborhood distribution?</label>
                  <select 
                    className="w-full border border-slate-200 focus:border-emerald-600 outline-none p-2.5 rounded-lg bg-white font-semibold text-slate-700 text-sm"
                    value={startedDistribution}
                    onChange={(e) => setStartedDistribution(e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              )}

              {postcardStatus === 'not_received' && (
                <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-xl text-xs space-y-1 text-amber-900 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-800 mb-1">Required Action</span>
                  Please secure the **POD number** from your dispatch vendor immediately and check delivery transit status.
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-base p-4 rounded-xl transition-all shadow-lg shadow-blue-100"
              >
                Log Operational Updates
              </button>
            </div>
            
            {status && (
              <p className={`text-center font-semibold p-3.5 rounded-xl text-xs ${status.includes('Successfully') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                {status}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
